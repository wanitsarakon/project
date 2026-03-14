import Phaser from "phaser";
import Spoon from "./components/Spoon";
import Fish from "./components/Fish";

const BG_IMAGE = new URL("./assetsFish/BGfish.png", import.meta.url).href;
const SPOON_IMAGE = new URL("./assetsFish/Spoon.png", import.meta.url).href;
const BUCKET_IMAGE = new URL("./assetsFish/WaterBowl.png", import.meta.url).href;
const FISH_IMAGES = {
  fish1: new URL("./assetsFish/1.png", import.meta.url).href,
  fish2: new URL("./assetsFish/2.png", import.meta.url).href,
  fish3: new URL("./assetsFish/3.png", import.meta.url).href,
  fish4: new URL("./assetsFish/4.png", import.meta.url).href,
  fish5: new URL("./assetsFish/5.png", import.meta.url).href,
};

export default class FishScoopingScene extends Phaser.Scene {

constructor(){
  super("FishScoopingScene");
}

init(data){

  this.roomCode = data.roomCode;
  this.player = data.player;
  this.roundId = data.roundId;
  this.onGameEnd = data.onGameEnd;

}

preload(){

  this.load.image("bg", BG_IMAGE);

  this.load.image("spoon", SPOON_IMAGE);

  this.load.image("bucket", BUCKET_IMAGE);

  this.load.image("fish1", FISH_IMAGES.fish1);
  this.load.image("fish2", FISH_IMAGES.fish2);
  this.load.image("fish3", FISH_IMAGES.fish3);
  this.load.image("fish4", FISH_IMAGES.fish4);
  this.load.image("fish5", FISH_IMAGES.fish5);

}

create(){

/* ---------------- SCORE ---------------- */

this.score = 0;

this.scoreText = this.add.text(
20,
20,
"คะแนน : 0",
{ fontSize:"28px", color:"#fff", fontFamily:"Kanit" }
);


/* ---------------- TIMER ---------------- */

this.timeLeft = 60;

this.timerText = this.add.text(
650,
20,
"เวลา : 60",
{ fontSize:"28px", color:"#fff", fontFamily:"Kanit" }
);

this.time.addEvent({

delay:1000,
loop:true,

callback:()=>{

this.timeLeft--;

this.timerText.setText("เวลา : " + this.timeLeft);

if(this.timeLeft <=0){

this.endGame();

}

}

});


/* ---------------- BG ---------------- */

this.add.image(400,300,"bg")
.setDisplaySize(800,600);


/* ---------------- BUCKET ---------------- */

this.bucket = this.physics.add.image(
120,
480,
"bucket"
)
.setScale(0.35)
.setImmovable(true);

this.bucket.body.allowGravity = false;


/* ---------------- SPOON ---------------- */

this.spoon = new Spoon(this,400,300);


/* ---------------- FISH ---------------- */

this.fishes = [];

const fishTextures = [
"fish1",
"fish2",
"fish3",
"fish4",
"fish5"
];

for(let i=0;i<6;i++){

const tex = Phaser.Utils.Array.GetRandom(fishTextures);

const fish = new Fish(
this,
Phaser.Math.Between(250,650),
Phaser.Math.Between(250,520),
tex,
"normal"
);

this.fishes.push(fish);

}

for(let i=0;i<2;i++){

const tex = Phaser.Utils.Array.GetRandom(fishTextures);

const fish = new Fish(
this,
Phaser.Math.Between(250,650),
Phaser.Math.Between(250,520),
tex,
"gold"
);

this.fishes.push(fish);

}


/* ---------------- COLLISION ---------------- */

this.physics.add.overlap(
this.spoon,
this.fishes,
this.catchFish,
null,
this
);

}


catchFish(spoon,fish){

if(spoon.holdingFish) return;

spoon.catchFish(fish);

}


update(){

const pointer = this.input.activePointer;

this.spoon.update(pointer);


/* fish AI */

for(const fish of this.fishes){

if(!fish.active) continue;

fish.update();

}


/* check bucket */

if(this.spoon.holdingFish){

const fish = this.spoon.holdingFish;

const dist = Phaser.Math.Distance.Between(
fish.x,
fish.y,
this.bucket.x,
this.bucket.y
);

if(dist < 70){

this.addScore(fish.score);

fish.destroy();

this.spoon.releaseFish();

}

}

}


addScore(points){

this.score += points;

this.scoreText.setText("คะแนน : " + this.score);

}


endGame(){

if(this.onGameEnd){

this.onGameEnd({
score:this.score,
roundId:this.roundId
});

}

}

}
