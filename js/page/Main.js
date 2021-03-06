/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import {
    StyleSheet,
    Image,
    View,
    Text,
    Platform,
    DeviceEventEmitter,
} from 'react-native';

import TabNavigator from 'react-native-tab-navigator';
import JPushModule from 'jpush-react-native';
// import {Navigator} from 'react-native-deprecated-custom-components'
import Home from './home/Home'
import Monitor from './monitor/Monitor'
import Alarm from './alarm/Alarm'
import Function from './function/Function'
import PopularPage from './PopularPage'
import TrendingPage from './TrendingPage'
import FavoritePage from './FavoritePage'
import MyPage from './my/MyPage'
import Toast, {DURATION} from 'react-native-easy-toast'
import BaseComponent from './BaseComponent'

export const ACTION_HOME = {A_SHOW_TOAST: 'showToast', A_RESTART: 'restart', A_THEME: 'theme'};
export const FLAG_TAB = {
    flag_homeTab: 'tb_home',
    flag_monitorTab: 'tb_monitor',
    flag_alarmTab: 'tb_alarm',
    flag_functionTab: 'tb_function',
    flag_popularTab: 'tb_popular',
    flag_trendingTab: 'tb_trending',
    flag_favoriteTab: 'tb_favorite',
    flag_my: 'tb_my'
};

// import codePush from 'react-native-code-push'
export default class Main extends BaseComponent {
    constructor(props) {
        super(props);
        let selectedTab = this.props.selectedTab ? this.props.selectedTab : 'tb_home';
        this.state = {
            selectedTab: selectedTab,
            theme: this.props.theme,
            crossPageData: null,
            homeBadge: null,
            alarmBadge: null,
        }
    }


    /**
     * 向CodePush服务器检查更新
     */
    // update(){
    //     codePush.sync({
    //         updateDialog: {
    //             appendReleaseDescription: true,
    //             descriptionPrefix:'更新内容',
    //             title:'更新',
    //             mandatoryUpdateMessage:'',
    //             mandatoryContinueButtonLabel:'更新',
    //         },
    //         mandatoryInstallMode:codePush.InstallMode.ON_NEXT_RESTART,
    //     });
    // }
    componentDidMount() {
        super.componentDidMount();
        this.DeviceEvent = DeviceEventEmitter.addListener('setBadge', (type, badge) => {
            // console.log('Main' + type + badge);
            if (type == 200) {
                //公告推送不进行设置
            } else {
                this.setState({
                    alarmBadge: badge,
                })
            }
        });

        // 添加首页公告badge。
        this.listener = DeviceEventEmitter.addListener('setNoticeBadge', (badge) => {
            this.setState({
                homeBadge: badge,
            })
        });

        this.listener = DeviceEventEmitter.addListener('ACTION_HOME',
            (action, params) => this.onAction(action, params));
        // this.update();
    }


    componentWillUnmount() {
        this.DeviceEvent.remove();
        this.listener.remove();
    }

    /**
     * 通知回调事件处理
     * @param action
     * @param params
     */
    onAction(action, params) {
        if (ACTION_HOME.A_RESTART === action) {
            this.onRestart(params)
        } else if (ACTION_HOME.A_SHOW_TOAST === action) {
            this.toast.show(params.text, DURATION.LENGTH_LONG);
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        if (this.listener) {
            this.listener.remove();
        }
    }

    /**
     * 重启首页
     * @param jumpToTab 默认显示的页面
     */
    onRestart(jumpToTab) {
        this.props.navigator.resetTo({
            component: HomePage,
            params: {
                ...this.props,
                selectedTab: jumpToTab
            }
        })
    }

    _renderTab(Component, selectedTab, title, renderIcon,renderSelectedIcon, badge) {
        return (
            <TabNavigator.Item
                selected={this.state.selectedTab === selectedTab}
                selectedTitleStyle={this.state.theme.styles.selectedTitleStyle}
                title={title}
                titleStyle={styles.titleStyle}
                renderIcon={() => <Image
                    style={styles.image}
                    source={renderIcon}/>}
                renderSelectedIcon={() => <Image
                    // style={[styles.image, this.state.theme.styles.tabBarSelectedIcon]}
                    style={[styles.image]}
                    source={renderSelectedIcon}/>}
                renderBadge={() => {
                    let textData = badge;
                    if (textData) {
                        return (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{textData}</Text>
                            </View>
                        )
                    }

                }}
                onPress={() => this.setState({selectedTab: selectedTab})}>
                <Component
                    {...this.props}
                    crossPageData={this.state.crossPageData}
                    setCrossPageData={(v, refresh) => {
                        if (refresh) {
                            this.setState({
                                crossPageData: v
                            });
                        } else {
                            this.state.crossPageData = v;
                        }
                    }}
                    routerChange={(nextRouter, arg) => {
                        this.setState({
                            selectedTab: nextRouter,
                            crossPageData: arg
                        });
                    }}
                    theme={this.state.theme}/>
            </TabNavigator.Item>
        )
    }

    render() {
        return (
            <View style={styles.container}>
                <TabNavigator
                    tabBarStyle={styles.tabBarStyle}>
                    {this._renderTab(Home, 'tb_home', '首页', require('../../res/Image/Tab/tab_home_nor.png'),require('../../res/Image/Tab/tab_home_hl.png'), this.state.homeBadge)}
                    {this._renderTab(Monitor, 'tb_monitor', '监控', require('../../res/Image/Tab/tab_monitor_nor.png'), require('../../res/Image/Tab/tab_monitor_hl.png'), null)}
                    {this._renderTab(Alarm, 'tb_alarm', '告警', require('../../res/Image/Tab/tab_alarm_nor.png'), require('../../res/Image/Tab/tab_alarm_hl.png'), this.state.alarmBadge)}
                    {this._renderTab(Function, 'tb_function', '功能', require('../../res/Image/Tab/tab_subsystem_nor.png'), require('../../res/Image/Tab/tab_subsystem_hl.png'), null)}
                    {/*{this._renderTab(PopularPage,'tb_popular','告警',require('../../res/images/ic_polular.png'),require('../../res/images/ic_polular.png'))}*/}
                    {/*{this._renderTab(TrendingPage,'tb_trending','趋势',require('../../res/images/ic_trending.png'), require('../../res/images/ic_trending.png'))}*/}
                    {/*{this._renderTab(FavoritePage,'tb_favorite','收藏',require('../../res/images/ic_favorite.png'), require('../../res/images/ic_favorite.png'))}*/}
                    {/*{this._renderTab(MyPage,'tb_my','我的',require('../../res/images/ic_my.png'),require('../../res/images/ic_my.png'))}*/}
                </TabNavigator>
                <Toast ref={(toast) => this.toast = toast}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBarStyle: {
        backgroundColor: '#ffffff',
    },
    titleStyle: {
        fontSize: 10,
    },
    image: {
        position: 'relative',
        top: 5,
        height: 30,
        width: 30,
    },
    badge: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 4,
        right: -2,
        paddingLeft: 4,
        paddingRight: 4,
        borderRadius: 7,
        backgroundColor: 'red',
    },
    badgeText: {
        fontSize: 10,
        color: 'white'
    }
});

