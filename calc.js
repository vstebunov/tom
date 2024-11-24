// @ts-check

import fs from 'fs';
import cp from 'child_process';
import open from 'open';
import {numeralize, Case, Gender} from "numeralize-ru";

class Executor {

    //@ts-ignore
    static get IDLE_VALUE () {
        return 0.333333;
    }
    /**
     * @param value {number}
     * @param parent {Executor}
     * @param label {number}
     */
    constructor(value, parent, label) {
        this.value = value;
        if (value < 0) {
            this.value = Math.abs(value);
        }
        this.parent = parent;
        this.label = label;
    }
    /**
     * @param childs {Executor[]}
     */
    setChilds(childs) {
        this.childs = childs;
    }

    /**
     * @returns {string}
     */
    makeString() {
        let str = '';
        const hsv = `${this.value} 1 0.25`;
        const label = this.parent ? 
            this.getCurrentError().toFixed(2)
            : 0;
        const style = `[fillcolor="${hsv}" label="${label}"]`;
        str += this.value.toString() + style + '\n';

        if (this.childs) {
            this.childs.forEach((child) => {
                str += [this.value, '->', child.value, '\n'].join('');
                str += child.makeString();
            });
        }
        return str;
    }

    /**
     * @returns number
     */
    getCurrentError() {
        return (Math.abs(Executor.IDLE_VALUE - this.value) / Executor.IDLE_VALUE)
    }
}

/**
 * @const Executor
 */
const tom = new Executor(Executor.IDLE_VALUE, null, 0);

const error = 0.1;
const childCount = 3;
const deep = 1;

const childs = generateChild(tom, error, childCount, deep);
tom.setChilds(childs);

const style = fs.readFileSync('style.dot').toString();

const graphlabel = [
    `Том Cойер нанял ${numeralize(childCount, Gender.Masculine, Case.Accusative)} Финнов и каждый слышит с ошибкой ${error}`,
    `Вместе они набрали ошибку ${accumulatedError(tom).toFixed(4)}`
].join('\n');

const text = `digraph tomgraph { label="${graphlabel}" ${style} ${tom.makeString()} }`;
fs.writeFileSync('result.dot', text);

cp.execSync('dot result.dot -Tsvg -o result.svg');
open('result.svg', {app: {name: 'firefox'}});


/**
 * @param {Executor} parent 
 * @param {number} error
 * @param {number} childCount
 * @param {number} deep
 * @param {number} currentLevel
 * @returns Executor[]
 */
function generateChild(parent, error, childCount, deep, currentLevel = 0) {
    const childs = Array(childCount).fill().map((_, idx) => {
        const node = new Executor(
            parent.value + (Math.random() * error * 2 - error),
            parent,
            parent.label + (idx + 1),
        );

        if (deep > currentLevel) {
            const childOFChilds = generateChild(node, error, childCount, deep, currentLevel+1);
            node.setChilds(childOFChilds);
        }

        return node;
    });
    return childs;
}

/**
 * @param {Executor} parent
 * @returns number
 */
function accumulatedError(parent) {
    let list = [...parent.childs];
    let acc = 0.0;
    do {
        const child = list.pop();
        if (child.childs) {
            list.push(...child.childs);
        } else {
            acc += child.getCurrentError();
        }
    } while (list.length > 0);
    return acc;
}
