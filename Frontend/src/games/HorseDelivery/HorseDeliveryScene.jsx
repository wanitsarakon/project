import Phaser from "phaser"

import Horse from "./components/Horse"
import Obstacle from "./components/Obstacle"
import Items from "./components/Items"
import ScoreManager from "./components/ScoreManager"

const GAME_TIME = 60

export default class HorseDeliveryScene extends Phaser.Scene {

constructor(){
super("HorseDeliveryScene")
}

/* ================= INIT ================= */

init(data={}){

this.playerData = data.player ?? null
this.onGameEnd = data.onGameEnd ?? null

this.timeLeft = GAME_TIME
this.ended = false

}

/* ================= PRELOAD ================= */

preload(){

this.load.image("bg","/assetsHorse/BGhorse.png")
this.load.image("horse","/assetsHorse/horse.png")
this.load.image("obstacle","/assetsHorse/obstacle.png")

this.load.image("item_candy","/assetsHorse/item_candy.png")
this.load.image("item_coin","/assetsHorse/item_coin.png")
this.load.image("item_gift","/assetsHorse/item_gift.png")
this.load.image("item_hay","/assetsHorse/item_hay.png")

this.load.image("sign","/assetsHorse/sign.png")

}

/* ================= CREATE ================= */

create(){

const width = this.scale.width
const height = this.scale.height

this.physics.world.gravity.y = 900

/* background */

this.add.image(width/2,height/2,"bg")
.setDisplaySize(width,height)

/* start sign */

this.showStartSign()

}

/* ================= START SIGN ================= */

showStartSign(){

const width = this.scale.width
const height = this.scale.height

const sign = this.add.image(width/2,height/2,"sign")
.setScale(0.8)
.setDepth(100)

sign.setInteractive()

sign.once("pointerdown",()=>{

sign.destroy()
this.startGame()

})

}

/* ================= START GAME ================= */

startGame(){

const width = this.scale.width
const height = this.scale.height

/* score */

this.scoreManager = new ScoreManager(this)

/* timer UI */

this.timeText = this.add.text(
width-20,
20,
`เวลา: ${GAME_TIME}`,
{
fontSize:"24px",
color:"#ffffff"
}
).setOrigin(1,0)

/* player */

this.player = new Horse(this,200,height-200)

/* groups */

this.obstacles = this.physics.add.group({
maxSize:20
})

this.items = this.physics.add.group({
maxSize:20
})

/* smoother spawn timers */

this.obstacleTimer = this.time.addEvent({

delay:1500,
loop:true,

callback:()=>{

this.spawnObstacle()

}

})

this.itemTimer = this.time.addEvent({

delay:2000,
loop:true,

callback:()=>{

this.spawnItem()

}

})

/* collisions */

this.physics.add.collider(
this.player,
this.obstacles,
this.hitObstacle,
null,
this
)

this.physics.add.overlap(
this.player,
this.items,
this.collectItem,
null,
this
)

/* input */

this.input.on("pointerdown",()=>{
this.player.jump()
})

/* timer */

this.timer = this.time.addEvent({

delay:1000,
loop:true,

callback:()=>{

if(this.ended)return

this.timeLeft--

this.timeText.setText(`เวลา: ${this.timeLeft}`)

if(this.timeLeft<=0){

this.endGame()

}

}

})

}

/* ================= SPAWN ================= */

spawnObstacle(){

const width = this.scale.width
const height = this.scale.height

const obstacle = new Obstacle(
this,
width+100,
height-180
)

this.obstacles.add(obstacle)

}

spawnItem(){

const width = this.scale.width
const height = this.scale.height

const item = new Items(
this,
width+100,
height-250
)

this.items.add(item)

}

/* ================= UPDATE ================= */

update(){

if(this.ended)return

/* recycle objects instead of destroy */

this.obstacles.children.each((obs)=>{

if(obs.active && obs.x < -100){

obs.destroy()

}

})

this.items.children.each((item)=>{

if(item.active && item.x < -100){

item.destroy()

}

})

}

/* ================= COLLISION ================= */

hitObstacle(player, obstacle){

obstacle.destroy()

this.scoreManager.addScore(-1)

}

collectItem(player, item){

const type = item.texture.key

item.destroy()

if(type==="item_gift"){

this.scoreManager.addScore(2)

}
else if(type==="item_hay"){

this.scoreManager.addScore(-1)

}
else{

this.scoreManager.addScore(1)

}

}

/* ================= END GAME ================= */

endGame(){

if(this.ended)return

this.ended=true

this.obstacleTimer?.remove()
this.itemTimer?.remove()
this.timer?.remove()

this.physics.pause()

this.showSummary()

}

/* ================= SUMMARY ================= */

showSummary(){

const width = this.scale.width
const height = this.scale.height

this.add.rectangle(
width/2,
height/2,
420,
260,
0x000000,
0.8
)

this.add.text(
width/2,
height/2-40,
"จบเกม!",
{
fontSize:"36px",
color:"#ffffff"
}
).setOrigin(0.5)

this.add.text(
width/2,
height/2,
`คะแนน: ${this.scoreManager.score}`,
{
fontSize:"28px",
color:"#ffff66"
}
).setOrigin(0.5)

let countdown = 5

const text = this.add.text(
width/2,
height/2+60,
`กลับซุ้มใน ${countdown}`,
{
fontSize:"22px",
color:"#ffffff"
}
).setOrigin(0.5)

this.time.addEvent({

delay:1000,
repeat:4,

callback:()=>{

countdown--

text.setText(`กลับซุ้มใน ${countdown}`)

if(countdown<=0){

if(this.onGameEnd){

this.onGameEnd({
score:this.scoreManager.score,
player:this.playerData
})

}else{

this.scene.start("FestivalMapScene")

}

}

}

})

}

}