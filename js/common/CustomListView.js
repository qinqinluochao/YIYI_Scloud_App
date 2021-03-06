/**
 *------------------- 自定义列表组件：-------------------------
 * 传入属性(this.props.)
 *      url         [string]    获取数据地址uri
 *      params      [object]    post请求参数
 *      alertText   [string]    easyToast组件,提示的文本内容
 *      renderRow   [Function]  原生listView组件渲染列表cell内容
 *      fusList     [Array]     根据业务需求，需要则列表页传入某些特定的数据
 *      noDateType  [string]    请求没有获得数据的时候，或者获取数据为空，需要实现的提示图片的类型，目前支持'noData（没有数据）、noAlarm（没有告警）'两种图片, 如果不传改属性。默认为noData类型图片
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
    DeviceEventEmitter
} from 'react-native'
import DataRepository from '../expand/dao/Data'
import NetInfoUtils from '../util/NetInfoUtils'
import Storage from '../common/StorageClass'
import NoContentPage from '../common/NoContentPage'
import Toast, {DURATION} from 'react-native-easy-toast';

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
            dataSource: new ListView.DataSource({
                rowHasChanged: (r1, r2) => {
                    return r1 !== r2;
                }
            }),
        }
    }

    /**
     * 一旦传入属性变化。
     * @param nextProps
     */
    componentWillReceiveProps(nextProps) {
    }

    /**
     * 组件装载，执行监听通知等操作
     */
    componentDidMount() {

        // 组件加载完毕，监听事件-从头加载数据。
        this.listener = DeviceEventEmitter.addListener('custom_listView', () => {
            this._onRefresh(true);
        });

        //  组件加载完毕，刷新listView数据源
        this.listener = DeviceEventEmitter.addListener('custom_listView_update', () => {
            this.copySource = this.objDeepCopy(this._data);
            this.setState({
                dataSource: this.state.dataSource.cloneWithRows(this.copySource),
            });
        });

        // console.log(this.props.params);
        InteractionManager.runAfterInteractions(() => {
            NetInfoUtils.checkNetworkState((isConnectedNet) => {
                if (isConnectedNet) {
                    this._onRefresh();
                } else {
                    this.setState({
                        noNetWork: true
                    });
                }
            });
        });
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
                    this._onRefresh(true);
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
        // console.log(this._data);
        // 开启加载动画
        if (isLoading) {
            this.setState({
                isLoading: true
            });
        }
        let url = this.props.url;
        let params = this.props.params;
        params.page = this.page;
        // params.size = 10;
        this.dataRepository.fetchNetRepository('POST', url, params).then(result => {
            if (result.success === true) {
                // alert(JSON.stringify(result));
                // 如果第一页没有数据，显示没有数据提示页面
                if (!result.data || result.data.length === 0) {
                    this.setState({
                        isLoading: false,
                        noNetWord: false,
                        noData: true
                    })
                    // console.log(result.data)
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
        this.timer = setTimeout(() => {
            this.page++;
            let url = this.props.url;
            let params = this.props.params;
            params.page = this.page;
            // params.size = 5;
            this.dataRepository.fetchNetRepository('POST', url, params).then(result => {
                if (result.success === true) {
                    // mock数据
                    // result.data = this._data;
                    // 如果第一页没有数据，显示没有数据提示页面
                    if ((this.page > 1 && (!result.data || result.data.length === 0))) {
                        // this.refs.toast.show(this.props.alertText);
                    } else {
                        // 将请求数据保存到内存
                        this._data = this._data.concat(result.data);
                        this.setState({
                            // dataSource: this._data,
                            dataSource: this.state.dataSource.cloneWithRows(this._data),
                        });
                    }
                } else {
                    // console.log('连接服务失败');
                }
            }).catch(error => {
                this.setState({
                    result: JSON.stringify(error)
                });
            })
        }, 2000);
    }

    /**
     * 组件卸载，清除事件监听
     */
    componentWillUnmount() {
        if (this.listener) {
            this.listener.remove();
        }
    }

    _renderListView() {
        return (
            <ListView
                dataSource={this.state.dataSource}
                renderHeader={
                    this.props.renderHeader ? this.props.renderHeader : null
                }
                renderFooter={() => {
                    // return <View>
                    //     <Text>加载中</Text>
                    //     <Text>加载中</Text>
                    //     <Text>加载中</Text>
                    //     <Text>加载中</Text>
                    //     <Text>加载中</Text>
                    // </View>
                    return true;
                }}
                renderRow={
                    this.props.renderRow ? this.props.renderRow
                        : this._renderDefaultRow.bind(this)
                }
                pageSize={5}
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
                    this._onRefresh.bind();
                    // alert('点我了')
                }}
            />
        } else {
            if (this.state.noData) {
                content = <NoContentPage
                    type={noData}
                    onClick={() => {
                        this._onRefresh.bind();
                        // alert('点我了')
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
