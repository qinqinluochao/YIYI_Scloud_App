/**
 * Created by penn on 2016/12/14.
 */

import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    ImageBackground,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Platform,
    Dimensions,
    InteractionManager,
} from 'react-native'
import NavigationBar from '../../common/NavigationBar'
import BulletinList from './BulletinList'
import MyPage from '../my/MyPage'
import MyInfoPage from '../my/MyInfoPage'
import HomeAlarmCell from './HomeAlarmCell'
import HomeStatisticChart from './HomeStatisticChart'
import DataRepository from '../../expand/dao/Data'
import Storage from '../../common/StorageClass'

let storage = new Storage();
let dataRepository = new DataRepository();
let {width, height} = Dimensions.get('window');
export default class Monitor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            theme: this.props.theme,
            isLoading: false,
            fsuCount: [
                {item: "在线", count: 1}
            ],
            allCount: 21,
            levelAlarm: [
                {item: "一级告警", count: 7},
                {item: "一级告警", count: 7},
                {item: "一级告警", count: 7},
                {item: "一级告警", count: 7},
            ],
            fsuWeekCount: [
                {onlineCount: 1, offlineCount: 14, recordTime: 1508094000117},
                {onlineCount: 1, offlineCount: 14, recordTime: 1508094000117},
                {onlineCount: 1, offlineCount: 14, recordTime: 1508094000117},
                {onlineCount: 1, offlineCount: 14, recordTime: 1508094000117},
                {onlineCount: 1, offlineCount: 14, recordTime: 1508094000117},
                {onlineCount: 1, offlineCount: 14, recordTime: 1508094000117},
                {onlineCount: 1, offlineCount: 14, recordTime: 1508094000117},
                {onlineCount: 1, offlineCount: 14, recordTime: 1508115600137},
            ],
        }
    }

    /**
     * 从本地获取登录信息，同时保存到单例，全局使用
     * @returns {Promise}
     * @private
     */
    _getStamp() {
        return new Promise((resolve, reject) => {
            dataRepository.fetchLocalRepository('/app/v2/user/login').then((result) => {
                storage.setLoginInfo(result);   // 保存loginInfo到单例
                resolve(result.stamp)
            }, (error) => {
                console.log(error);
                reject(error)
            })
        })
    }

    /**
     * 渲染navigationBar右侧按钮
     * @returns {XML}
     * @private
     */
    _renderRightButton() {
        return (
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity
                    onPress={() => {
                        this.props.navigator.push({
                            component: BulletinList,
                            params: {...this.props}
                        })
                    }}>
                    <View style={{padding: 5, marginRight: 8}}>
                        <Image
                            style={{width: 24, height: 24}}
                            source={require('../../../res/Image/Nav/ic_notice_nor.png')}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    /**
     * 渲染navigationBar左侧按钮
     * @returns {XML}
     * @private
     */
    _renderLeftButton() {
        return (
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity
                    onPress={() => {
                        this.props.navigator.push({
                            component: MyInfoPage,
                            params: {...this.props}
                        })
                    }}>
                    <View style={{padding: 5, marginRight: 8}}>
                        <Image
                            style={{width: 24, height: 24}}
                            source={require('../../../res/Image/Nav/ic_myItem.png')}
                        />
                        {/*<Text>个人</Text>*/}
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    /**
     * 获取FSU数量（按在线状态统计
     * @param stamp
     * @returns {Promise}
     * @private
     */
    _getFsuCount(stamp) {
        return new Promise((resolve, reject)=> {
            let URL = '/app/v2/statistics/count/fsu';
            let params = {
                stamp: stamp
            };
            dataRepository.fetchNetRepository('POST', URL, params).then(result => {
                // console.log(result);
                // alert(JSON.stringify({'fsu数量': result}));
                // this.setState({
                //     fsuCount: result.data
                // })
                resolve(result);
            }, (error)=> {
                reject(error);
            })
        })
    }

    /**
     * 一周FSU数量
     * @private
     */
    _getWeekFsuCount(stamp) {
        return new Promise((resolve,reject)=> {
            let URL = '/app/v2/statistics/counts/fsu/week';
            let params = {
                stamp: stamp
            };
            dataRepository.fetchNetRepository('POST', URL, params).then((result) => {
                // console.log(result);
                // 获取 一周fsu数量
                // alert(JSON.stringify({'一周FSU': result}));
                // console.log(result);
                // this.setState({
                //     fsuWeekCount: result.data
                // })
                resolve(result);
            },(error)=> {
                reject(error);
            })
        });
    }

    /**
     * 获取告警数量
     * @param stamp
     * @private
     */
    _getAlarmCount(stamp) {
        return new Promise((resolve, reject)=> {
            let URL = '/app/v2/statistics/count/alarm';
            let params = {
                stamp: stamp,
                status: 2,
                type: 1
            };
            dataRepository.fetchNetRepository('POST', URL, params).then(result => {
                // alert(JSON.stringify({'alarm数量': result}));
                // console.log(result);
                // this.setState({
                //     levelAlarm: result.data
                // });

                // 计算告警数量总和


                // this.setState({
                //     allCount: allCount
                // });

                console.log(this.state);
                resolve(result);
            }, (error)=> {
                reject(error)
            })
        })
    }

    /**
     * 刷新获取所有数据
     * @private
     */
    _refreshData() {
        this._getStamp().then((stamp) => {
            // 三个请求操作都是promise操作的话，用Promise.all()
            //
            Promise.all([
                this._getFsuCount(stamp),
                this._getWeekFsuCount(stamp),
                this._getAlarmCount(stamp)
            ]).then((results)=> {
                console.log(results);

                // 计算告警数量总和
                let allCount = 0;
                for (let i = 0; i < results[0].data.length; i++) {
                    allCount += results[0].data[i].count
                }

                this.setState({
                    fsuCount: results[0].data,
                    fsuWeekCount: results[1].data,
                    levelAlarm: results[2].data,
                    allCount: allCount
                })
            });
            // this._getFsuCount(stamp);
            // this._getWeekFsuCount(stamp);
            // this._getAlarmCount(stamp);
        });
    }

    render() {
        let statusBar = {
            backgroundColor: this.state.theme.themeColor,
            barStyle: 'light-content'
        };
        let navigationBar =
            <NavigationBar
                title={'主控页面'}
                statusBar={statusBar}
                style={this.state.theme.styles.navBar}
                rightButton={this._renderRightButton()}
                leftButton={this._renderLeftButton()}/>;
        let content =
            <ScrollView
                style={styles.scrollView}
                ref='scrollView'
                horizontal={false}
                showsVerticalScrollIndicator={true}
                showsHorizontalScrollIndicator={false}  // 水平滚动条控制
                pagingEnabled={true}
                refreshControl={
                    <RefreshControl
                        title='Loading...'
                        titleColor={this.props.theme.themeColor}
                        colors={[this.props.theme.themeColor]}
                        refreshing={this.state.isLoading}
                        onRefresh={() => {
                            this._refreshData();
                        }}
                        tintColor={this.props.theme.themeColor}
                    />
                }>
                <View style={{flex: 1}}>
                    <ImageBackground
                        style={styles.gb}
                        source={require('../../../res/Image/Login/ic_login_bg.png')}
                    >
                        {/*<HomeStatisticChart chartData={this.state.fsuWeekCount}*/}
                                            {/*width={width}*/}
                                            {/*height={height * 0.4}/>*/}
                    </ImageBackground>
                    <View style={styles.alarmWrap}>
                        <View style={styles.alarm}>
                            <HomeAlarmCell
                                count={this.state.levelAlarm[0].count}
                                allCount={this.state.allCount}
                                alarmName={this.state.levelAlarm[0].item}
                                alarmColor='#1CCAEB'/>
                            <HomeAlarmCell
                                count={this.state.levelAlarm[1].count}
                                allCount={this.state.allCount}
                                alarmName={this.state.levelAlarm[1].item}
                                alarmColor='#F63232'/>
                            <HomeAlarmCell
                                count={this.state.levelAlarm[2].count}
                                allCount={this.state.allCount}
                                alarmName={this.state.levelAlarm[2].item}
                                alarmColor='#F9AE46'/>
                            <HomeAlarmCell
                                count={this.state.levelAlarm[3].count}
                                allCount={this.state.allCount}
                                alarmName={this.state.levelAlarm[3].item}
                                alarmColor='#E6CD0D'/>
                        </View>
                    </View>
                </View>
            </ScrollView>;

        return (
            <View style={styles.container}>
                {navigationBar}
                {content}
            </View>
        )
    }

    // shouldComponentUpdate(nextProps,nextState){
    //     //写自己的逻辑判断是否需要更新组件
    //     return false;
    // }

    componentDidMount() {
        alert(123456);
        // 页面加载完成再去渲染数据，减缓卡顿问题
        // InteractionManager.runAfterInteractions(() => {
            this._refreshData()

        // });
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    scrollView: {
        backgroundColor: '#F3F3F3'
    },
    gb: {
        width: width,
        height: 0.4 * height,
    },
    overlay: {
        width: width,
        height: 0.1 * height,
        position: 'absolute',
        // bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        // alignItems: 'center',
    },
    alarmWrap: {
        width: width,
        height: 0.4 * height,
        position: 'relative',
    },
    alarm: {
        position: 'absolute',
        top: -height * 0.05,
        width: width,
        height: 0.45 * height,
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 16,
    },

});

