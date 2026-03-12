export default class PullSystem{

constructor(scene,rope){

this.scene = scene
this.rope = rope

this.power = 0

}

pull(){

this.power += 5

this.rope.moveLeft()

}

}