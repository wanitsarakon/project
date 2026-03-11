import Phaser from "phaser"
import Spoon from "./components/Spoon.js"

/* ===== IMPORT ASSETS ===== */

import bgImg from "./assetsFish/BGfish.png"

import fish1 from "./assetsFish/1.png"
import fish2 from "./assetsFish/2.png"
import fish3 from "./assetsFish/3.png"
import fish4 from "./assetsFish/4.png"
import fish5 from "./assetsFish/5.png"

import spoonImg from "./assetsFish/Spoon.png"
import bucketImg from "./assetsFish/WaterBowl.png"

import startSign from "./assetsFish/fish_start.png"
import scoreSign from "./assetsFish/fish_score.png"

import startSound from "./sounds/start.mp3"
import countdownSound from "./sounds/countdown.mp3"

/* ===================== */

const GAME_TIME = 60
const CONFIRM_TIME = 650

const FISH_SCORE = { normal:1 , gold:3 }

const ESCAPE_DISTANCE = 55
const ESCAPE_FORCE = 22

const MAX_FISH = 7
const FISH_LIFE = 7000

/* ===================== */

export default class FishScoopingScene extends Phaser.Scene{

constructor(){
super({key:"FishScoopingScene"})
}

/* ================= INIT ================= */

init(data={})

{

this.player=data.player ?? null
this.onGameEnd=data.onGameEnd ?? null

this.timeLeft=GAME_TIME
this.score=0

this.failHit=0

this.pendingFish=null
this.pendingTimer=null

this.baseFishSpeed=90
this.spawnDelay=1100

this.isDragging=false
this.ended=false

}

/* ================= PRELOAD ================= */

preload(){

this.load.image("bg",bgImg)

this.load.image("fish1",fish1)
this.load.image("fish2",fish2)
this.load.image("fish3",fish3)
this.load.image("fish4",fish4)
this.load.image("fish5",fish5)

this.load.image("spoon",spoonImg)
this.load.image("bucket",bucketImg)

this.load.image("startSign",startSign)
this.load.image("scoreSign",scoreSign)

this.load.audio("startSound",startSound)
this.load.audio("countdownSound",countdownSound)

}

/* ================= CREATE ================= */

create(){

const {width,height}=this.scale

/* background */

const bg=this.add.image(width/2,height/2,"bg")

const scaleX=width/bg.width
const scaleY=height/bg.height

bg.setScale(Math.max(scaleX,scaleY))

/* ===== start screen ===== */

this.showStartSign()

}

/* ================= START SCREEN ================= */

showStartSign(){

const {width,height}=this.scale

const sign=this.add.image(
width/2,
height/2,
"startSign"
)
.setDepth(500)
.setScale(0.8)

sign.setInteractive()

sign.once("pointerdown",()=>{

this.sound.play("startSound")

sign.destroy()

this.startGame()

})

}

/* ================= START GAME ================= */

startGame(){

const {width,height}=this.scale

/* pool */

this.poolCenterX=width/2
this.poolCenterY=height*0.60
this.poolRadius=height*0.19

/* UI */

this.scoreText=this.add.text(
16,16,
"คะแนน: 0",
{fontSize:"20px",color:"#fff"}
)

this.timeText=this.add.text(
width-16,
16,
`เวลา: ${GAME_TIME}`,
{fontSize:"20px",color:"#fff"}
).setOrigin(1,0)

/* bucket */

this.bucket=this.physics.add
.staticImage(width*0.22,height-60,"bucket")
.setScale(0.42)

/* spoon */

this.spoon=new Spoon(this,width/2,height/2)
this.spoon.setDepth(5)

/* input */

this.input.on("pointermove",(p)=>{

if(!this.ended && this.spoon?.active){

this.spoon.moveTo(p.x,p.y)

}

})

this.input.on("pointerdown",()=>{

if(this.ended)return

const fish=this.pendingFish

if(!fish || fish.following)return

this.isDragging=true

this.pendingFish=null

fish.pending=false
fish.following=true
fish.caught=true

fish.setVelocity(0)

})

this.input.on("pointerup",()=>{

this.isDragging=false

})

/* group */

this.fishes=this.physics.add.group({
allowGravity:false,
maxSize:50
})

this.physics.add.overlap(
this.spoon,
this.fishes,
this.tryCatchFish,
null,
this
)

/* timers */

this.spawnTimer=this.time.addEvent({
delay:this.spawnDelay,
loop:true,
callback:this.spawnFish,
callbackScope:this
})

this.timer=this.time.addEvent({
delay:1000,
loop:true,
callback:this.tick,
callbackScope:this
})

}

/* ================= SPAWN ================= */

spawnFish(){

if(this.fishes.countActive(true)>=MAX_FISH)return

const rand=Phaser.Math.Between(1,100)

let randomKey
let type="normal"

if(rand<=5){

randomKey="fish5"
type="gold"

}
else if(rand<=35){

randomKey="fish1"

}
else if(rand<=60){

randomKey="fish2"

}
else if(rand<=80){

randomKey="fish3"

}
else{

randomKey="fish4"

}

const angle=Phaser.Math.FloatBetween(0,Math.PI*2)
const radius=Phaser.Math.FloatBetween(0,this.poolRadius-35)

const x=this.poolCenterX+Math.cos(angle)*radius
const y=this.poolCenterY+Math.sin(angle)*radius

const fish=this.fishes.get(x,y,randomKey)

if(!fish)return

fish.enableBody(true,x,y,true,true)

fish.setTexture(randomKey)
fish.setScale(type==="gold"?0.14:0.12)

fish.type=type
fish.value=FISH_SCORE[type]

fish.following=false
fish.pending=false
fish.scored=false

let speed=this.baseFishSpeed+Phaser.Math.Between(-20,20)

fish.spawnTime=this.time.now

fish.setVelocity(
Phaser.Math.Between(-speed,speed),
Phaser.Math.Between(-40,40)
)

}

/* ================= UPDATE ================= */

update(){

if(this.ended)return

this.spoon?.update?.()

this.fishes.children.iterate((fish)=>{

if(!fish?.active)return

if(fish.following){

fish.setPosition(
this.spoon.x+this.spoon.netOffsetX,
this.spoon.y+this.spoon.netOffsetY
)

this.checkDropIntoBucket(fish)

}

})

}

/* ================= CATCH ================= */

tryCatchFish(spoon,fish){

if(!fish || fish.following || fish.pending || this.isDragging)return

fish.pending=true
this.pendingFish=fish

this.pendingTimer?.remove()

this.pendingTimer=this.time.delayedCall(
CONFIRM_TIME,
()=>{

if(this.pendingFish===fish && !fish.following){

this.pendingFish=null
fish.pending=false

this.failHit++

}

})

}

/* ================= SCORE ================= */

checkDropIntoBucket(fish){

const bucketBounds=this.bucket.getBounds()

if(bucketBounds.contains(fish.x,fish.y)){

this.scoreFish(fish)

}

}

scoreFish(fish){

if(!fish || fish.scored)return

fish.scored=true

this.score+=fish.value

this.scoreText.setText(`คะแนน: ${this.score}`)

fish.disableBody(true,true)

}

/* ================= TIMER ================= */

tick(){

if(this.ended)return

this.timeLeft--

this.timeText.setText(`เวลา: ${this.timeLeft}`)

if(this.timeLeft===10){

this.sound.play("countdownSound")

}

if(this.timeLeft<=0)this.endGame()

}

/* ================= END GAME ================= */

endGame(){

if(this.ended)return

this.ended=true

this.spawnTimer?.remove()
this.timer?.remove()

this.input.enabled=false

this.showSummary()

}

/* ================= SUMMARY ================= */

showSummary(){

const {width,height}=this.scale

this.add.image(
width/2,
height/2,
"scoreSign"
).setDepth(200).setScale(0.8)

this.add.text(
width/2,
height/2-10,
`คะแนน: ${this.score}`,
{fontSize:"32px",color:"#000"}
).setOrigin(0.5)

let countdown=10

const text=this.add.text(
width/2,
height/2+60,
`กลับซุ้มใน ${countdown}`,
{fontSize:"22px",color:"#000"}
).setOrigin(0.5)

this.time.addEvent({

delay:1000,
repeat:9,

callback:()=>{

countdown--

text.setText(`กลับซุ้มใน ${countdown}`)

if(countdown<=0){

if(this.onGameEnd){

this.onGameEnd({
score:this.score,
player:this.player
})

}else{

this.scene.start("FestivalMapScene")

}

}

}

})

}

}