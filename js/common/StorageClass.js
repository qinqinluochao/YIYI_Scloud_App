let instance = null;
export default class LocalStorageClass {
    searchHistoryArr = [];

    constructor() {
        if (!instance) {
            instance = this;
        }
        return instance;
    }

    // 操作用户登录
    setLoginInfo(data) {
        this.loginInfo = data;
    }

    getLoginInfo() {
        return this.loginInfo;
    }

    // 保存用户名密码
    setUserInfo(userInfo) {
        this.userInfo = userInfo;
    }

    getUserInfo() {
        return this.userInfo;
    }


    // 操作搜索历史记录数组
    addSearchHistory(item) {
        this.searchHistoryArr.push(item)
    }

    deleteSearchHistory(item) {
        this.searchHistoryArr.splice(this.searchHistoryArr.indexOf(item), 1);
    }

    deleteAllSearchHistory() {
        this.searchHistoryArr = [];
    }

    getAllSearchHistory() {
        return this.searchHistoryArr
    }

    /**
     * 设置服务器地址
     * @param IP
     */
    setServerAddress(IP){
        this.IP = IP;
    }
    getServerIP(){
        return this.IP;
    }

    getAlarmFilterSiteId () {
        return this.alarmFilterSiteId || [];
    }

    setAlarmFilterSiteId (siteId) {
        this.alarmFilterSiteId = siteId;
    }

    /**
     *  保存推送条数
     * @param bage
     */
    setBadge(badge){
        this.badge = badge;
    }
    getBadge(){
        return this.badge;
    }
    /**
     * 判断是否是代理商用户
     * @param isClasses
     */
    setIsClasses(isClasses){
        this.isClasses = isClasses;
    }
    getIsClasses(){
        return this.isClasses;
    }

    /**
     * 保存userId与agencyId 切换代理商用户时用到
     */
    setCompanyData(companyData){
        this.companyData = companyData;
    }
    getCompanyData(){
        return this.companyData;
    }

}
