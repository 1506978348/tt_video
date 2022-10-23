
export class byteDanceManager {

    private static _instance = null;
    static instance(): byteDanceManager {
        if(!byteDanceManager._instance) {
            byteDanceManager._instance = new byteDanceManager();
        }
        return byteDanceManager._instance;
    }

    tt: any = null;

    videoHasStop: boolean = false;
    videoHasEnd: boolean = false;
    private isShow: boolean = false;

    private videoAd = null;
    private interstitialAd = null;

    private gameRecorder: any = null;//屏幕录制管理器
    private totalRecord: number = 300;//总共录屏时间
    private recordTime: number = 0;//已经录屏时间
    private recordTimer: any = null;//录屏定时器
    private videoPath: string = '';
    private recentAdTime: Date = new Date();//上次观看广告时间，用于处理CD
    private isCallback: boolean = false;


    init() {
        this.tt = window["tt"];
        this.preloadAds();
    }
    //预加载广告
    preloadAds(){
        this.preloadReward();
        this.preloadInterstitial();
    }

    preloadReward(){
        if(this.tt.createRewardedVideoAd){
            this.videoAd = this.tt.createRewardedVideoAd({
                adUnitId: ''//激励id
            })
        }
    }

    preloadInterstitial(){
        if(this.tt.createInterstitialAd){
            this.interstitialAd = this.tt.createInterstitialAd({
                adUnitId: ''//插屏id
            })
        }
    }
    //播放激励
    public showVideo(args: { beginCallback?: () => void, successCallback?: () => void, failCallback?: () => void; }) {
        args = args || {};
        if (!this.videoAd) {
            this.preloadReward();
        }
        this.videoAd.show().catch(() => {
            this.videoAd.load()
                .then(() => this.videoAd.show())
                .catch(err => {
                    console.log("show videoAd fail:", err);
                    args.failCallback && args.failCallback();
                })
        })
        this.videoAd.onError((err) => {
            console.log("videoAd load fail:", err);
            args.failCallback && args.failCallback();
        })

        // try {
        //     if (this.videoAd.closeHandler) {
        //         this.videoAd.offClose(this.videoAd.closeHandler);
        //         console.log("videoAd.offClose卸载成功");
        //     }
        // } catch (e) {
        //     console.log("videoAd.offClose 卸载失败");
        //     console.error(e);
        // }

        this.videoAd.closeHandler = function (res) {
            console.log("激励视频播放完成：：：：", args.successCallback);

            if (res && res.isEnded || res === undefined) {
                //正常播放结束
                args.successCallback && args.successCallback();
            } else {
                args.failCallback && args.failCallback();
            }
        };
        if(this.isCallback){
            
        }else{
            this.isCallback = true;
            this.videoAd.onClose((res) => {
                this.videoAd.closeHandler(res);
            });
        }
    }

    //显示插屏
    public showInterstitial(args: { successCallback?: () => void, failCallback?: () => void }){
        args = args || {};
        if(!this.interstitialAd){
            this.preloadInterstitial();
            console.log("__!this.interstitialAd")
        }

        this.interstitialAd.load()
            .then(() => {
                this.interstitialAd.show().then(() => {
                    args.successCallback && args.successCallback();
                })
            })
            .catch((err) => {
                console.log("interstitialAd load fail:", err);
                args.failCallback && args.failCallback();
            })

        this.interstitialAd.onClose(()=>{
            this.interstitialAd.destroy();
            this.preloadInterstitial();
        })
    }

    shareGame() {

    }

    //普通分享，建议使用onShareFunc方法
    shareAppFunc(title: string, image: string, onSuccess: Function, onFail: Function){
        this.tt.shareAppMessage({
            title: title,
            imageUrl: image,
            success: () => {
                onSuccess && onSuccess();
            },
            fail: (e) => {
                onFail && onFail();
            }
        })
    }
    
    //分享
    public onShareFunc(text: string, image: string, callback: Function){
        let channel = "";
        this.tt.getSystemInfo({
            success: (res) => {
                console.log("getSystemInfo success: ", res);
                if (res.appName === 'Douyin') {
                    channel = "invite";//好友列表分享
                } else if(res.appName === 'Toutiao'){
                    channel = 'article';//图文分享
                } else {
                    channel = '';//普通分享
                }
            },
            fail: (res) => {
                console.log("getSystemInfo fail: ", res);
                channel = '';
            }
        })
        this.tt.shareAppMessage({
            // templateId: "",
            title: text,
            channel: channel,
            imageUrl: image,
            success: ()=>{
                callback && callback();
            },
            fail: ()=>{
                callback && callback();
            },
            complete: ()=>{
            }
        })
    }

    //录屏分享
    shareRecordVideo(title: string, videoPath: string, onSuccess: Function, onFail: Function) {
        this.tt.shareAppMessage({
            title: title,
            channel: "video",
            extra: {
                videoTopics: [],
                hashtag_list: [],
                videoPath: videoPath,
                withVideoId: true,
            },
            success: (res) => {
                onSuccess && onSuccess();
            },
            fail: (e) => {
                if(this.checkAppName()){
                    onSuccess && onSuccess();
                }else{
                    onFail && onFail();
                }
            }
        })
    }

    private checkAppName(){
        //当前今日头条ios无法获得分享成功回调
        let result = false;
        this.tt.getSystemInfo({
            success: (res) => {
                if(res.platform === 'ios' && res.appName === 'Toutiao'){
                    result = true
                }
            },
            fail: (e) => {
                console.log("getSystemInfo fail: ", e);
            }
        })
        return result;
    }

    //录屏开始主动调用
    startRecord(callback: Function){
        if(!this.tt) {
            callback && callback();
            return;
        }
        if(!this.gameRecorder){
            this.gameRecorder = this.tt.getGameRecorderManager();
        }
        this.videoHasEnd = false;
        this.videoHasStop = false;
        this.gameRecorder.start({duration: this.totalRecord});
        this.gameRecorder.onStart(() => {
            this.recordTime = 0;
            this.recordTimer = setInterval(() => {
                this.recordTime++;
            }, 1000);
            callback && callback();
        });

        this.gameRecorder.onResume(() => {
            this.recordTimer = setInterval(() => {
                this.recordTime++;
            }, 1000)
        });

        this.gameRecorder.onPause(() => {
            clearInterval(this.recordTimer);
        });

        this.gameRecorder.onStop((res) => {
            this.videoHasEnd = true;
            this.videoPath = res.videoPath;
            console.log("this.videoPath：", this.videoPath);
            clearInterval(this.recordTimer);
            this.recordTime = 0;
        });

        this.gameRecorder.onError((e) => {
            console.log("gameRecord error: ", e);
        })
    }

    resumeRecord(callback: Function){
        if(!this.tt) {
            return;
        }
        if(!this.gameRecorder){
            console.log("gameRecorder is null, resumeRecord fail");
        }else{
            this.gameRecorder.resume();
            callback && callback();
        }
    }

    pauseRecord(callback: Function){
        if(!this.tt) {
            return;
        }
        if(!this.gameRecorder){
            console.log("gameRecorder is null, pauseRecord fail");
        }else{
            this.gameRecorder.pause();
            callback && callback();
        }
    }

    stopRecord(callback: Function){
        if(!this.tt) {
            return;
        }
        if(!this.gameRecorder){
            console.log("gameRecorder is null, stopRecord fail")
        }else{
            this.gameRecorder.stop();
            callback && callback();
        }
    }

    //获取录屏地址
    getVideoPath(){
        return this.videoPath;
    }
    
    //右上角分享
    public onRightUpShare(callback: Function){
        try {
            this.tt.showShareMenu({
                success: ()=>{},
                fail: ()=>{},
                complete: ()=>{}
            });
    
            this.tt.onShareAppMessage(function(res){
                return{
                    title: "一起游戏吧!",
                    imageUrl: "",
                    success: ()=>{},
                    fail: (e)=>{
    
                    }
                }
            })
        } catch (error) {
            cc.log("右上角分享开启失败，可能不是h5");
        }
    }

    //添加到我的小程序功能
    showFavorityGuide(){
        if(this.isShow) return;
        this.isShow = true;
        try {
            this.tt.showFavoriteGuide({
                type: "bar",
                content: "一键添加到我的小程序",
                position: "bottom",
                succres: (res) => {
                    console.log("showFavorityGuide success：", res);
                },
    
                fail: (res) => {
                    console.log("showFavorityGuide fail：", res)
                }
            })
        } catch (error) {
            
        }
    }

    //添加桌面快捷方式
    addShortCut(){
        try {
            this.tt.addShortcut({
                success: () => {
                    console.log("添加到桌面成功：");
                },
                fail: (err) => {
                    console.log("添加到桌面失败：", err);
                }
            })   
        } catch (error) {
            
        }
    }

    //检查桌面快捷方式
    checkShortCutExist(){
        let result = false;
        try {
            this.tt.checkShortcut({
                success: (res) => {
                    console.log("check short cut success : ", res);
                    if(res && res.status && res.status.exist){
                        result = true;
                    }
                },
                fail: (res) => {
                    console.log("check short cut fail: ", res);
                }
            })
        } catch (error) {
            
        }
        return result;
    }

    //检测新版本，
    checkNewVersion() {
        let updateManager = this.tt.getUpdateManager();
        updateManager.onCheckForUpdate((res) => {
            // 请求完新版本信息的回调
            if (!res.hasUpdate) {
                return;
            }
        });
        updateManager.onUpdateReady((res) => {
            this.tt.showModal({
                title: "更新提示",
                content: "新版本已经准备好，是否重启小游戏？",
                success: (res) => {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate();
                    }
                },
            });
        });

        updateManager.onUpdateFailed((err) => {
            // 新的版本下载失败
            console.log("版本下载失败原因", err);
            // 新版本下载失败不告知
            // this.tt.showToast({
            //     title: "新版本下载失败，请稍后再试",
            //     icon: "none",
            // });
        });
    }
}

export const btMgr = byteDanceManager.instance();


