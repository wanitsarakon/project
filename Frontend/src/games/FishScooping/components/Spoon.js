import Phaser from "phaser";

export default class Spoon extends Phaser.Physics.Arcade.Image{

constructor(scene,x,y){

super(scene,x,y,"spoon");

scene.add.existing(this);
scene.physics.add.existing(this);

this.setScale(0.2);

this.body.setCircle(25);

this.holdingFish = null;

}

update(pointer){

this.x = pointer.worldX;
this.y = pointer.worldY;

if(this.holdingFish){

this.holdingFish.x = this.x;
this.holdingFish.y = this.y;

}

}

catchFish(fish){

if(this.holdingFish) return;

this.holdingFish = fish;

fish.body.enable = false;

}

releaseFish(){

this.holdingFish = null;

}

}