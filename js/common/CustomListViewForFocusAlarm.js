/**
 *------------------- 自定义列表组件：-------------------------
 * 传入属性(this.props.)
 *      url         [string]    获取数据地址uri
 *      params      [object]    post请求参数
 *      alertText   [string]    easyToast组件,提示的文本内容
 *      renderRow   [Function]  原生listView组件渲染列表cell内容
 *      fusList     [Array]     根据业务需求，需要则列表页传入某些特定的数据
 *      noDateType  [string]    请求没有获得数据的时候，或者获取数据为空，需要实现的提示图片的类型，目前支持'noData（没有数据）、noAlarm（没有告警）'两种图片
 *
 *
 *
 *----------------------------------------------------------
 */
import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    ListView,
    RefreshControl,
    TouchableOpacity,
    InteractionManager,
    DeviceEventEmitter,
    Platform
} from 'react-native'
import DataRepository from '../expand/dao/Data'
import NetInfoUtils from '../util/NetInfoUtils'
import Storage from '../common/StorageClass'
import NoContentPage from '../common/NoContentPage'
import Toast, {DURATION} from 'react-native-easy-toast';
import JPushModule from 'jpush-react-native';

let storage = new Storage();

export default class CustomListView extends Component {
    constructor(props) {
        super(props);
        // 初始化类实例
        this.dataRepository = new DataRepository();
        this.page = 1;
        this._data = [];
        this.copySource = [];
        this.state = {
            noNetWork: false,
            noData: false,
            isLoading: false,
            theme: this.props.theme,
            dataSource: new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2}),
        }
    }

    /**
     * 一旦传入属性变化。
     * @param nextProps
     */
    componentWillReceiveProps(nextProps) {
        // 如果传入自动刷新，组件每次加载都会自动加载数据一次。
        // if (this.props.isAutoRefresh) {
        //     console.log(this.props);
        //     alert(JSON.stringify(nextProps.params));
        //     this.props = nextProps;
        //     this._onRefresh()
        // }
    }

    /**
     * 组件装载，执行监听通知等操作
     */
    componentDidMount() {
        // 组件加载完毕，监听事件-重新加载数据。
        this.listener = DeviceEventEmitter.addListener('refresh_focus_alarm', (p) => {
            // 当params想要修改的时候，可以传入参数p进行覆盖。可以覆盖原有的字段或者属性
            if (p) {
                for (let i in p) {
                    this.props.params[i] = p[i];
                }
            }

            // 首次加载告警
            this.timer = setTimeout(() => {
                clearTimeout(this.timer);
                this._onRefresh(true);
            }, 100);

        });

        //  组件加载完毕，刷新listView数据源
        this.listener = DeviceEventEmitter.addListener('custom_listView_alarm_update', () => {
            this.copySource = this.objDeepCopy(this._data);
            this.setState({
                dataSource: this.state.dataSource.cloneWithRows(this.copySource),
            });
        });

        InteractionManager.runAfterInteractions(() => {
            NetInfoUtils.checkNetworkState((isConnectedNet) => {
                if (isConnectedNet) {
                    this._onRefresh(true);
                } else {
                    this.setState({
                        noNetWork: true
                    });
                }
            });
        });

    }

    /**
     * 组件卸载，清除事件监听
     */
    componentWillUnmount() {
        if (this.listener) {
            this.listener.remove();
        }
    }

    /**
     *
     */
    _renderRefreshControl() {
        return (
            <RefreshControl
                title='加载中...'
                titleColor={this.state.theme.themeColor}
                colors={[this.state.theme.themeColor]}
                tintColor={this.state.theme.themeColor}
                refreshing={this.state.isLoading}
                onRefresh={() => {
                    // 刷新的时候从第一页重新获取数据
                    this._onRefresh();
                }}/>
        )
    }

    /**
     * 渲染默认的cell
     * @param rowData
     * @param sectionID
     * @param rowID
     * @param hightlightRow
     * @returns {XML}
     * @private
     */
    _renderDefaultRow(rowData, sectionID, rowID, hightlightRow) {
        return (
            <TouchableOpacity
                activeOpacity={0.5}
                onPress={() => {
                    this.props.onPressCell('我是来自子组件的数据');
                }}>
                <View style={styles.defaultRow}>
                    <Text>我是CELL</Text>
                </View>
            </TouchableOpacity>
        )
    }


    /**
     * 刷新重新渲染第一页数据
     * @param isLoading 是否下拉加载的动画
     * @private
     */
    _onRefresh(isLoading) {
        this.page = 1;
        this._data = [];
        // 获取传入fsu列表
        if (this.props.fsuList) {
            this._data = this._data.concat(this.props.fsuList);
        }
        // 开启加载动画
        if (isLoading) {
            this.setState({
                isLoading: true
            });
        }
        let url = this.props.url;
        let params = this.props.params;
        params.page = this.page;
        // 判断是否有推送badge 有就清除
        // console.log('alarmBadge'+storage.getBadge());
        // alert(123);
        if (storage.getBadge() !== 0 && storage.getBadge() !== null) {
            this.timer = setTimeout(() => {
                clearTimeout(this.timer);
                storage.setBadge(0);
                if (Platform.OS === 'ios') {
                    JPushModule.setBadge(0, (badgeNumber) => {
                        console.log(badgeNumber)
                    });
                } else {
                    DeviceEventEmitter.emit('clearAndroidBadge');
                }
                DeviceEventEmitter.emit('setBadge', '101', 0);
            }, 0);
        }

        // console.log(params);
        this.dataRepository.fetchNetRepository('POST', url, params).then(result => {
            if (result.success === true) {
                // alert(JSON.stringify(result.data));
                // 如果第一页没有数据，显示没有数据提示页面
                if (!result.data || result.data.length === 0) {
                    // alert(page);
                    // console.log('第一页');
                    this.setState({
                        isLoading: false,
                        noNetWord: false,
                        noData: true
                    })
                } else {
                    // 将请求数据保存到内存
                    this._data = this._data.concat(result.data);
                    this.setState({
                        result: result,
                        dataSource: this.state.dataSource.cloneWithRows(this._data),
                        isLoading: false,
                        noData: false,
                    })
                }
            } else {
                // console.log('连接服务失败');
            }
        }).catch(error => {
            this.setState({
                result: JSON.stringify(error)
            });
        })
    }

    /**
     * 对象数组深拷贝
     */

    objDeepCopy(source) {
        let sourceCopy = source instanceof Array ? [] : {};
        for (let item in source) {
            sourceCopy[item] =
                typeof source[item] === 'object'
                    ? this.objDeepCopy(source[item])
                    : source[item];
        }
        return sourceCopy;
    }

    /**
     * 上拉加载更多
     * @private
     */
    _onLoadMore() {
        this.page++;
        let url = this.props.url;
        let params = this.props.params;
        params.page = this.page;
        this.dataRepository.fetchNetRepository('POST', url, params).then(result => {
            if (result.success === true) {
                // 如果第一页没有数据，显示没有数据提示页面
                if ((this.page > 1 && (!result.data || result.data.length === 0))) {
                    // this.refs.toast.show(this.props.alertText);
                } else {
                    this._data = this._data.concat(result.data);
                    this.setState({
                        dataSource: this.state.dataSource.cloneWithRows(this._data),
                    })
                }
            } else {
                // console.log('连接服务失败');
            }
        }).catch(error => {
            this.setState({
                result: JSON.stringify(error)
            });
        })
    }


    _renderListView() {
        return (
            <ListView
                dataSource={this.state.dataSource}
                renderHeader={
                    this.props.renderHeader ? this.props.renderHeader : null
                }
                renderRow={
                    this.props.renderRow ? this.props.renderRow
                        : this._renderDefaultRow.bind(this)
                }
                onEndReachedThreshold={30}
                removeClippedSubviews={false}
                onEndReached={() => {
                    this._onLoadMore();
                }}
                refreshControl={
                    this._renderRefreshControl()
                }
            />
        )
    }

    render() {
        let content;
        let noData =
            this.props.noDataType
                ? this.props.noDataType
                : 'noData';

        if (this.state.noNetWork) {
            content = <NoContentPage
                type='noNetWork'
                onClick={() => {
                    this._onRefresh();
                }}
            />
        } else {
            if (this.state.noData) {
                content = <NoContentPage
                    type={noData}
                    onClick={() => {
                        this._onRefresh();
                    }}
                />
            } else {
                content = this._renderListView();
            }
        }

        return (
            <View style={styles.container}>
                {content}
                <Toast
                    ref="toast"
                    style={{backgroundColor: 'rgba(0,0,0,0.3)'}}
                    position='bottom'
                    positionValue={300}
                    fadeInDuration={500}
                    fadeOutDuration={1000}
                    opacity={0.8}
                    textStyle={{color: '#000000'}}
                />
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F3F3'
    },
    defaultRow: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 100,
        marginTop: 2,
        borderWidth: 2,
        borderColor: 'black',
    },
});
