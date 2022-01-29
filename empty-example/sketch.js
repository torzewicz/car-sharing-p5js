const hexRadius = 40;

let hexes = [];
let cars = [];
let numberOfCars = 20;
// let customers = [];
let agents = [];
let numberOfCustomers = 0;

const envWidth = 1200;
const envHeight = 700;

let slider;
let select;
let button;

let selectMode = 'HEX_STATUS';

let counter = 0;
let minutes = 0;
let hours = 0;

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function setup() {
    createCanvas(envWidth, envHeight);
    background(0);
    hexes = createHexGrid(envWidth - 100, envHeight);

    for (let i = 0; i < hexes.length; i++) {
        hexes[i].findNeighbours();
    }

    for (let i = 0; i < numberOfCars; i++) {
        let assigned = false;
        do {
            const randomHex = hexes[getRandomInt(0, hexes.length)];
            if (randomHex.getCars().length === 0) {
                cars.push(new Car(randomHex.positionX, randomHex.positionY));
                assigned = true;
            }
        } while (!assigned)

    }

    for (let i = 0; i < numberOfCustomers; i++) {
        customers.push(new Customer(getRandomInt(50, envWidth - 50), getRandomInt(50, envHeight - 50)));
    }

    slider = createSlider(0, 100, 50);
    slider.position(1050, 140);
    slider.style('width', '100px');

    select = createSelect();
    select.position(1050, 240);
    select.option('HEX_STATUS');
    select.option('ADD_AGENT');

    button = createButton('Add random Agent');
    button.position(1050, 340);
    button.style('width', '100px');

}

const drawText = () => {
    fill(255, 255, 255)
    const parsedTime = `${hours <= 9 ? `0${hours}` : hours.toString()}:${minutes <= 9 ? `0${minutes}` : minutes.toString()}`
    textAlign(CENTER, CENTER);
    text(parsedTime, 1100, 20)
    text(`Prawdodobieństwo wybrania bonusowego miejsca: ${slider.value() / 100}`, 1075, 60, 50);
    text(`Reakcja na wybranie hexagonu:`, 1075, 180, 50);
}


function draw() {
    background(0);
    for (let i = 0; i < hexes.length; i++) {
        hexes[i].resolveHex();
        hexes[i].show();

    }

    for (let i = 0; i < numberOfCars; i++) {
        cars[i].move();
        cars[i].show();
    }

    for (let i = 0; i < agents.length; i++) {
        agents[i].move();
        agents[i].show();
        agents[i].resolveAgent();
    }

    drawText();
    // console.log(counter);
    if (counter % 20 === 0) {
        minutes++;
        if (minutes % 60 === 0) {
            minutes = 0;
            hours++;
        }
    }
    counter++;

    select.changed(() => {
        const item = select.value();
        selectMode = item;
    });

    button.mousePressed(() => {
        const randomHex = hexes[getRandomInt(0, hexes.length)];
        agents.push(new Agent(randomHex));
    })
}

function mouseClicked() {


    for (let i = 0; i < hexes.length; i++) {
        if (hexes[i].pressed()) {
            return;
        }
    }


}

const createHexGrid = (width, height) => {
    const objects = []
    const angle = 2 * PI / 6;
    for (let y = hexRadius; y + hexRadius * Math.sin(angle) < height; y += hexRadius * Math.sin(angle)) {
        for (let x = hexRadius, j = 0; x + hexRadius * (1 + Math.cos(angle)) < width; x += hexRadius * (1 + Math.cos(angle)), y += (-1) ** j++ * hexRadius * Math.sin(angle)) {
            objects.push(new Hexagon(x, y));
        }
    }
    return objects;
}

class Hexagon {

    constructor(positionX, positionY) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.r = 40;
        this.counter = 0;
        this.neighbours = [];
        this.timestamp = getCurrentTimestamp();
    }

    getSettingsFromCounter = () => {
        switch (this.counter) {
            case 0:
                return {
                    color: 'rgba(66,135,63,0.5)', text: 'Małe'
                }
            case 1:
                return {
                    color: 'rgba(255, 255, 0, 0.5)', text: 'Średnie'
                }
            case 2:
                return {
                    color: 'rgba(255, 0, 0, 0.5)', text: 'Duże'
                }

        }
    }

    downgradeCounter() {
        if (this.counter > 0) {
            this.counter--;
        }
    }

    show() {
        const a = 2 * PI / 6;
        strokeWeight(1);
        stroke(255, 255, 255)
        fill(`${this.getSettingsFromCounter().color}`)
        beginShape()
        for (let i = 0; i <= 6; i++) {
            vertex(this.positionX + this.r * Math.cos(a * i), this.positionY + this.r * Math.sin(a * i));
        }
        endShape();
        textAlign(CENTER, CENTER);
        stroke(0)
        noFill()
        text(this.getSettingsFromCounter().text, this.positionX, this.positionY);

        if (this.counter > 0) {
            stroke(212, 121, 121)
            strokeWeight(3);

            for (let i = 0; i < this.neighbours.length; i++) {
                line(this.positionX, this.positionY, this.neighbours[i].positionX, this.neighbours[i].positionY);
            }
        }
    }

    findNeighbours() {
        for (let i = 0; i < hexes.length; i++) {
            if (dist(this.positionX, this.positionY, hexes[i].positionX, hexes[i].positionY) < 2 * this.r && hexes[i] !== this) {
                this.neighbours.push(hexes[i]);
            }
        }

    }

    getCars() {
        let tempCars = [];
        for (let i = 0; i < cars.length; i++) {
            if (dist(this.positionX, this.positionY, cars[i].positionX, cars[i].positionY) <= this.r) {
                tempCars.push(cars[i]);
            }
        }
        return tempCars;
    }

    increaseCounter() {
        if (this.counter < 2) {
            this.counter++;
        }
        this.timestamp = getCurrentTimestamp();
    }

    increaseNeighboursCounter() {
        for (let i = 0; i < this.neighbours.length; i++) {
            this.neighbours[i].increaseCounter();
        }
    }

    resolveHex() {
        if (this.containsAgent()) {
            this.timestamp = getCurrentTimestamp();
        } else {
            const currentTimestamp = getCurrentTimestamp();
            if (getTimeDifferenceInMinutes(this.timestamp, currentTimestamp) > 20) {
                this.timestamp = currentTimestamp;
                this.downgradeCounter();
            }
        }
    }

    neighbourHasAgent() {
        for (let i = 0; i < this.neighbours.length; i++) {
            if (this.neighbours[i].containsAgent()) {
                this.neighbours[i].timestamp = getCurrentTimestamp();
            }
        }
    }

    containsAgent() {
        let contains = false;
        for (let i = 0; i < agents.length; i++) {
            if (agents[i].hex === this) {
                contains = true;
            }
        }
        return contains;
    }

    pressed() {
        if (dist(this.positionX, this.positionY, mouseX, mouseY) < this.r) {
            // console.log()
            if (selectMode === 'HEX_STATUS') {
                if (this.counter === 2) {
                    this.counter = 0
                } else {
                    this.counter++;
                }
            } else if (selectMode === 'ADD_AGENT') {
                agents.push(new Agent(this));
            }
            return true;
        }

        return false;
    }

}

class Car {

    constructor(positionX, positionY) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.isBeingUsed = false;
        this.reservedBy = undefined;
        this.r = 20;
        this.speed = 2;
        this.destination = undefined;
    }


    show() {
        stroke(255, 255, 255)
        strokeWeight(1);
        if (this.isBeingUsed) {
            fill(153, 102, 51)
        } else {
            fill(0)
        }
        circle(this.positionX, this.positionY, this.r)
        stroke(0);
        noFill();
        text(cars.indexOf(this), this.positionX, this.positionY);

        if (!!this.destination) {
            this.destination.show();

        }
    }

    // pressed() {
    //     if (dist(this.positionX, this.positionY, mouseX, mouseY) < this.r) {
    //         this.reserveAndFindDestination();
    //         return true;
    //     }
    //
    //     return false;
    // }

    setAsUsedAndFindDestination() {
        if (!this.isBeingUsed) {
            this.isBeingUsed = true;
            const randomHex = hexes[getRandomInt(0, hexes.length)];
            this.destination = new Destination(randomHex);
            this.destination.checkIfNeighbourRequiresCar();
        }

    }

    move() {
        if (this.isBeingUsed && !!this.destination) {
            this.destination.checkIfNeighbourRequiresCar();
            this.destination.move();
            if (dist(this.destination.positionX, this.destination.positionY, this.positionX, this.positionY) > 1) {

                const vector = createVector(this.destination.positionX - this.positionX, this.destination.positionY - this.positionY);
                vector.normalize();

                this.positionX += vector.x * this.speed;
                this.positionY += vector.y * this.speed;

            } else {
                this.destination.destinationHex.downgradeCounter();
                this.destination = undefined;
                this.isBeingUsed = false;
                this.reservedBy = undefined;
            }
        }

    }


}

class Destination {

    constructor(destinationHex) {
        this.destinationHex = destinationHex
        this.positionX = destinationHex.positionX;
        this.positionY = destinationHex.positionY;
        this.speed = 2;
        this.r = 20;
        this.changedDestination = false;
        this.probability = Math.random();
    }

    show() {
        fill(153, 12, 200)
        circle(this.positionX, this.positionY, this.r)
    }

    checkIfNeighbourRequiresCar() {
        if (this.probability >= (1 - slider.value())) {
            const hexNeighbours = this.destinationHex.neighbours;

            let newHex = undefined;
            let maxCounter = 0;

            for (let i = 0; i < hexNeighbours.length; i++) {
                if (hexNeighbours[i].counter > maxCounter) {
                    maxCounter = hexNeighbours[i].counter;
                    newHex = hexNeighbours[i];
                }
            }

            if (!!newHex) {
                if (this.changedDestination) {
                    if (maxCounter > this.destinationHex.counter) {
                        this.destinationHex = newHex;
                    }
                } else {
                    this.destinationHex = newHex;
                }

                this.changedDestination = true;
            }
        }
    }

    move() {

        if (dist(this.destinationHex.positionX, this.destinationHex.positionY, this.positionX, this.positionY) > 1) {

            const vector = createVector(this.destinationHex.positionX - this.positionX, this.destinationHex.positionY - this.positionY);
            vector.normalize();

            this.positionX += vector.x * this.speed;
            this.positionY += vector.y * this.speed;

        }
    }

}

class Agent {

    constructor(hex) {
        this.hex = hex;
        this.positionX = hex.positionX;
        this.positionY = hex.positionY;
        this.size = 15;
        this.goToHex = undefined;
        this.timestamp = getCurrentTimestamp();
        this.speed = 0.5;
        this.agentState = 0;
    }


    show() {
        stroke(255, 255, 255)
        strokeWeight(1);
        fill(0, 51, 204)
        rect(this.positionX - this.size / 2, this.positionY - this.size / 2, this.size, this.size);
        textAlign(CENTER, CENTER);
        stroke(0);
        noFill();

        text(agents.indexOf(this), this.positionX, this.positionY);
    }

    resolveAgent() {
        let newHex = undefined;
        if (this.hex.getCars().filter(car => !car.isBeingUsed && (!car.reservedBy || car.reservedBy === this)).length > 0) {
            const car = this.hex.getCars().filter(car => !car.isBeingUsed && (!car.reservedBy || car.reservedBy === this))[0];
            car.reservedBy = this;
            car.setAsUsedAndFindDestination();
            agents = agents.filter(i => i !== this);
        } else {
            if (!this.goToHex) {
                const nearHexes = this.hex.neighbours;

                // let newHex = undefined;
                let maxCars = 0;

                for (let i = 0; i < nearHexes.length; i++) {
                    const freeCars = nearHexes[i].getCars().filter(car => !car.isBeingUsed && !car.reservedBy);
                    if (freeCars.length > maxCars) {
                        maxCars = freeCars.length;
                        newHex = nearHexes[i];
                    }
                }

                if (!!newHex) {
                    this.goToHex = newHex;
                    this.goToHex.getCars().filter(car => !car.isBeingUsed && !car.reservedBy)[0].reservedBy = this;
                }
            }
        }

        if (!newHex && !this.goToHex) {
            const currentTimestamp = getCurrentTimestamp();

            if (getTimeDifferenceInMinutes(this.timestamp, currentTimestamp) > 10) {
                this.timestamp = currentTimestamp;

                switch (this.agentState) {
                    case 0:
                    case 1:
                        this.hex.increaseCounter();
                        this.agentState++;
                        break;
                    case 2:
                        this.hex.increaseNeighboursCounter();
                        this.agentState++;
                        break;
                    case 3:
                        this.goToHex = this.hex.neighbours[getRandomInt(0, this.hex.neighbours.length)];
                        this.agentState = 0;
                        break;
                }
            }
        }
    }

    move() {
        if (!!this.goToHex) {
            if (dist(this.goToHex.positionX, this.goToHex.positionY, this.positionX, this.positionY) > 1) {

                const vector = createVector(this.goToHex.positionX - this.positionX, this.goToHex.positionY - this.positionY);
                vector.normalize();

                this.positionX += vector.x * this.speed;
                this.positionY += vector.y * this.speed;

            } else {
                this.hex = this.goToHex;
                this.goToHex = undefined;
            }
        }
    }


}


const getCurrentTimestamp = () => {
    return hours * 60 + minutes;
}

const getTimeDifferenceInMinutes = (firstTimestamp, secondTimestamp) => {
    return Math.abs(firstTimestamp - secondTimestamp);
}