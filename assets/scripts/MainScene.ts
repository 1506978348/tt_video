import { btMgr } from "./byteDanceManager";
import ShareVideo from "./ShareVideo";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MainScene extends cc.Component {

    @property(cc.Node)
    private startBtn: cc.Node = null;

    @property(cc.Node)
    private endBtn: cc.Node = null;

    @property(cc.Node)
    private dragNode: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        btMgr.init();
        this.endBtn.active = false;
        this.startBtn.on(cc.Node.EventType.TOUCH_END, this.gameStart, this);
        this.endBtn.on(cc.Node.EventType.TOUCH_END, this.gameEnd, this);
    }

    start () {

    }

    private gameStart(){
        btMgr.startRecord(()=>{
            console.log('startRecord');
            this.startBtn.active = false;
            this.scheduleOnce(()=>{
                this.endBtn.active = true;
            }, 5);
            this.dragNode.on(cc.Node.EventType.TOUCH_MOVE, (event)=>{
                this.dragNode.x+=event.getDelta().x;
                this.dragNode.y+=event.getDelta().y
            }, this)
        });
    }

    private gameEnd(){
        btMgr.stopRecord(()=>{
            this.scheduleOnce(()=>{
                let videoPath = btMgr.getVideoPath();//获取录屏文件
                console.log(videoPath);
                cc.resources.load('prefabs/ShareVideo', cc.Prefab, (err, asset: cc.Prefab) => {
                    if (err) {
                        cc.log(err);
                        return;
                    }
                    let shareVideo = cc.instantiate(asset);
                    shareVideo.parent = cc.director.getScene();
                    shareVideo.getComponent(ShareVideo).initVideo(videoPath);
                });
            },1)
        })
    }

    // update (dt) {}
}
