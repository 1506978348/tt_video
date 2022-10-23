import { btMgr } from "./byteDanceManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ShareVideo extends cc.Component {

    
    @property(cc.Node)
    private parentNode: cc.Node = null;

    @property(cc.Node)
    private shareBtn: cc.Node = null;


    // onLoad () {}
    private _recordVideo: string = null

    private cameraNode;
    private video;
    private videoTexture: cc.Texture2D;

    onLoad() {
        this.shareBtn.on(cc.Node.EventType.TOUCH_END, this.onShareBtn, this);
    }

    start () {

    }

    initVideo(video: string){
        this.showcamera(video);
        this._recordVideo = video;
    }

    private showcamera(video: string) {
        this.cameraNode = new cc.Node();
        this.cameraNode.width = this.parentNode.width;
        this.cameraNode.height = this.parentNode.height;
        this.cameraNode.addComponent(cc.Sprite)
        this.parentNode.addChild(this.cameraNode);
        if (typeof window['tt'] !== 'undefined') {
            this.playVideo(video);
        }
    }

    private playVideo(video: string) {
        this.video = window['tt'].createOffscreenVideo();
            // 传入视频src
            this.video.src = video;
            this.video.onCanplay(() => {
                if(this.node && this.node.isValid){
                    this.video.play();
                    this.videoTexture = new cc.Texture2D();
                    this.videoTexture.initWithElement(this.video);
                    this.videoTexture.handleLoadedTexture();
                    this.cameraNode.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(this.videoTexture);
                    this.cameraNode.width = this.parentNode.width;
                    this.cameraNode.height = this.parentNode.height;

                    // this.cameraNode.width = cc.view.getVisibleSize().width;
                    // this.cameraNode.height = this.video.videoHeight / this.video.videoWidth * this.cameraNode.width;
                }
            });
            this.video.onCandraw(()=>{

            })
            this.video.onPlay(()=>{
                console.log("开始录屏");

            });
            this.video.onEnded(()=>{
            });
            this.video.onPause(()=>{
            });
        }

    update(dt) {
        if (this.video && this.videoTexture) {
            this.videoTexture.update({
                image: this.video,
                flipY: false
            });
        }
    }

    onShareBtn(){
        btMgr.shareRecordVideo("", this._recordVideo, 
        ()=>{

        }, 
        ()=>{

        })
    }
}
