import Phaser from "phaser";
import Spoon from "./components/Spoon";
import Fish from "./components/Fish";

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

  this.load.image("bg","/src/games/FishScooping/assetsFish/BGfish.png");

  this.load.image("spoon","/src/games/FishScooping/assetsFish/Spoon.png");

  this.load.image("bucket","/src/games/FishScooping/assetsFish/WaterBowl.png");

  this.load.image("fish1","/src/games/FishScooping/assetsFish/1.png");
  this.load.image("fish2","/src/games/FishScooping/assetsFish/2.png");
  this.load.image("fish3","/src/games/FishScooping/assetsFish/3.png");
  this.load.image("fish4","/src/games/FishScooping/assetsFish/4.png");
  this.load.image("fish5","/src/games/FishScooping/assetsFish/5.png");

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