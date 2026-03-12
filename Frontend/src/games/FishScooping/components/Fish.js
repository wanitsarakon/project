import Phaser from "phaser";

export default class Fish extends Phaser.Physics.Arcade.Sprite{

constructor(scene,x,y,texture,type){

super(scene,x,y,texture);

scene.add.existing(this);
scene.physics.add.existing(this);

this.type = type;

this.setScale(0.28);

this.baseSpeed = 30;

if(type === "gold"){

this.baseSpeed = 60;
this.score = 2;
this.setTint(0xffd700);

}else{

this.score = 1;

}

this.moveTimer = 0;

}

update(){

this.moveTimer--;

if(this.moveTimer <=0){

this.moveTimer = Phaser.Math.Between(60,160);

const angle = Phaser.Math.FloatBetween(0,Math.PI*2);

this.scene.physics.velocityFromRotation(
angle,
this.baseSpeed,
this.body.velocity
);

}

}
}