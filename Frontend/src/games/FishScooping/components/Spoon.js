import Phaser from "phaser";

export default class Spoon extends Phaser.Physics.Arcade.Image{

constructor(scene,x,y){

super(scene,x,y,"spoon")

this.netOffsetX=0
this.netOffsetY=42

scene.add.existing(this)
scene.physics.add.existing(this)

this.setScale(0.30)
.setOrigin(0.5)
.setDepth(5)

const radius=34

this.setCircle(radius)

this.body.setOffset(
this.width*0.30,
this.height*0.55
)

this.body.setAllowGravity(false)
this.body.setImmovable(true)

}

moveTo(x,y){

this.targetX=x
this.targetY=y

}

update(){

const smooth=0.25

this.x=Phaser.Math.Linear(
this.x,
this.targetX-this.netOffsetX,
smooth
)

this.y=Phaser.Math.Linear(
this.y,
this.targetY-this.netOffsetY,
smooth
)

}

breakNet(duration=3000){

if(this.isBroken)return

this.isBroken=true

this.body.enable=false

this.scene.time.delayedCall(duration,()=>{

this.isBroken=false
this.body.enable=true

})

}

}