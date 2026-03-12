export default class SoundManager{

constructor(scene){

this.scene = scene

this.bgm = scene.sound.add("bgm",{loop:true})

}

playBGM(){

this.bgm.play()

}

}