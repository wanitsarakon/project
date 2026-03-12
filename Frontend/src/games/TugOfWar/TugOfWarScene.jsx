import Phaser from "phaser"

import RopeSystem from "./RopeSystem"
import PullPhysics from "./PullPhysics"
import PullSystem from "./PullSystem"
import CharacterManager from "./CharacterManager"
import AISystem from "./AISystem"
import BuffSystem from "./BuffSystem"
import RPSSystem from "./RPSSystem"
import ScoreSystem from "./ScoreSystem"
import WinSystem from "./WinSystem"
import SoundManager from "./SoundManager"
import UIManager from "./UIManager"

export default class TugOfWarScene extends Phaser.Scene{

constructor(){
super("TugOfWarScene")
}

preload(){

this.load.image("rope","/assets/tugofwar/images/rope.png")

this.load.image("kid","/assets/tugofwar/images/kid.png")
this.load.image("kid_pull","/assets/tugofwar/images/kid_pull.png")

this.load.image("man","/assets/tugofwar/images/man.png")
this.load.image("man_pull","/assets/tugofwar/images/man_pull.png")

this.load.audio("battle_bgm","/assets/tugofwar/sounds/battle_bgm.mp3")

}

create(){

this.ropeSystem = new RopeSystem(this)

this.pullPhysics = new PullPhysics(this.ropeSystem)

this.pullSystem = new PullSystem(this.pullPhysics)

this.characters = new CharacterManager(this)

this.buffSystem = new BuffSystem()

this.rpsSystem = new RPSSystem()

this.ai = new AISystem(this.pullPhysics)

this.soundManager = new SoundManager(this)

this.ui = new UIManager(this)

this.scoreSystem = new ScoreSystem(this,this.ropeSystem)

this.winSystem = new WinSystem(this,this.ropeSystem)

this.space = this.input.keyboard.addKey("SPACE")

this.soundManager.play()

}

update(){

if(Phaser.Input.Keyboard.JustDown(this.space)){

this.pullSystem.playerPull()

this.characters.playerPull()

}

this.ai.update()

this.winSystem.check()

}
}