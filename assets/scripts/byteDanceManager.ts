
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

    private gameRecorder: any = null;//屏幕录制管理器
    private totalRecord: number = 300;//总共录屏时间
    private recordTime: number = 0;//已经录屏时间
    private recordTimer: any = null;//录屏定时器
    private videoPath: string = '';
    private recentAdTime: Date = new Date();//上次观看广告时间，用于处理CD


    init() {
        this.tt = window["tt"];
    }

    shareGame() {

    }

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

    getVideoPath(){
        return this.videoPath;
    }


    public onShareFunc(text: string, image: string, callback: Function){
        let channel = "";
        this.tt.getSystemInfo({
            success: (res) => {
                console.log("getSystemInfo success: ", res);
                if (res.appName === 'Douyin') {
                    channel = "invite";
                } else if(res.appName === 'Toutiao'){
                    channel = 'article';
                } else {
                    channel = '';
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
}

export const btMgr = byteDanceManager.instance();


