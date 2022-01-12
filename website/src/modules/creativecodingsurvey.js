import { loadJSON } from '../utils/ajax.js';
import { mockData } from '../data/surveyData.js';

import * as P5 from "p5";

import '../css/creativecodingsurvey.scss';

export class CreativeCodingSurvey {
    constructor(element, options) {
        this.canvasEntitites    = [];
        this.iconSet            = [];
        this.altSet             = [];
    }

    setup(sketch, surveyData) {
        this.sketch             = sketch;
        this.surveyData         = surveyData;
        this.typeCount          = {
            enthusiast: 0,
            maker: 0,
            organisation: 0,
            contributor: 0,
            venue: 0,
            event: 0,
            anonymous: 0,
        };

        function lerpCoordinates(mousePosition, boundingMin, boundingMax, lerpMin, lerpMax) {
            return (mousePosition - boundingMin)/(boundingMax - boundingMin) * (lerpMax - lerpMin) + lerpMin;
        }
        let root = document.documentElement;
        root.addEventListener("mousemove", e => {
            root.style.setProperty('--boxShadowX', `${lerpCoordinates((window.innerWidth/2 - e.clientX), 0, -window.innerWidth, 0, 3)}px`);
            root.style.setProperty('--boxShadowY', `${lerpCoordinates((window.innerHeight/2 - e.clientY), 0, -window.innerHeight, 0, 3)}px`);
        });

        // sketch.createCanvas(sketch.windowWidth, sketch.windowHeight)

        // create definitive set of results,
        let discplines = sketch.createDiv("+").position(40, 100).id('filter-disciplines')
            .class('filters')
            .mouseOver( function (){ showDisciplines(sketch, 30, 90) } )

        this.surveyData.map((responseEntity) => {
            const randX         = sketch.round(sketch.random(0, window.innerWidth));
            const randY         = sketch.round(sketch.random(0, window.innerHeight)) + 100;
            const entityType    = responseEntity.responses.type.length ? responseEntity.responses.type[0].toString().toLowerCase().trim() : 'anonymous';

            this.typeCount[entityType]++;

            let clickableEntity             = document.createElement('div');
            clickableEntity.id              = responseEntity.id;
            clickableEntity.style.left      = `${randX}px`;
            clickableEntity.style.top       = `${randY + 100}px`;

            for (let entityDiscipline of responseEntity.responses.disciplines) {
                console.log(responseEntity.responses,entityDiscipline)
                clickableEntity.classList.add(entityDiscipline.toLowerCase().replace(' ',''));
            }
            clickableEntity.classList.add( `icon`, `icon-${entityType}`);

            document.body.appendChild(clickableEntity)

            clickableEntity.addEventListener('mouseover', function (){
                showDetails(sketch, responseEntity, randX-10, randY + 25) }
            );

            // add an initial entity position, randomly relative to the current viewport
            this.canvasEntitites.push({
                entity: responseEntity,
                coordinates: { x: randX, y: randY },
                state: 'inactive',
                draw: () => {}
            });
        });

        for (const [type, count] of Object.entries(this.typeCount)) {
            const typeContainer = document.querySelector( `.menu li.${type} a`);
            typeContainer.setAttribute('data-value', count);
        }
        const totalCountContainer = document.querySelector( `.menu li:first-of-type`);
        totalCountContainer.setAttribute('data-value', this.surveyData.length);

        function showDetails(sketch, e, x, y) {
            console.log(e.responses);
            let elemId = 'd_' + e.id;
            let show = sketch.createDiv().position(x, y).id(elemId)
                .style("background", "white")
                .style("border", "2px solid red")
                .style("padding", "3px")
                .html("<div style='padding:10px; font-size:75%;' onmouseleave='(function(){ let a = document.getElementById(\"" + elemId + "\"); a.remove(); })()'>"
                    + "<div>" + replaceUndefined(e.responses.name) + "</div>"
                    + "<div>" + replaceUndefined(e.responses.website) + "</div>"
                    + "<div>" + replaceUndefined(e.responses.countryOfResidence) + "</div>"
                    + "<div style='color: red'>" + ('disciplines' in e.responses ? e.responses.disciplines.join(' ') : '') + "</div>"
                    + "<div style='color: green'>" + ('tools' in e.responses ? e.responses.tools.join(' ') : '') + "</div>"
                    + "</div>"
                    );
            }

        function showDisciplines(sketch, x, y) {
                let show = sketch.createDiv().position(x, y).id('disciplines')
                    .style("background", "white")
                    .style("border", "2px solid red")
                    .style("padding", "3px")
                    .style("z-index", "2")
                    .html("<div style='padding:10px; font-size:75%;' onmouseleave='(function(){ let a = document.getElementById(\"disciplines\"); a.remove(); })()'>"
                        + "<div class='category' onclick='highlightEntities(\"Design\")'>Design</div>"
                        + "<div class='category' onclick='highlightEntities(\"Art\")'>Art</div>"
                        + "<div class='category' onclick='highlightEntities(\"Education\")'> Education</div>"
                        + "<div class='category' onclick='highlightEntities(\"Music\")'>Music</div>"
                        + "<div class='category' onclick='highlightEntities(\"Performance\")'>Performance</div>"
                        + "<div class='category' onclick='highlightEntities(\"Science\")'>Science</div>"
                        + "<div class='category' onclick='highlightEntities(\"Digital Culture\")'>Digital Culture</div>"
                        + "<div class='category' onclick='highlightEntities(\"Live Coding\")'>Live Coding</div>"
                        + "</div>"
                        );
                }

        function replaceUndefined(s) {
            return s === undefined ? 'anonymous' : s
        }

    }


    draw(sketch) {
        sketch.background(255);

        this.canvasEntitites.map((canvasEntity) => {
            canvasEntity.draw()
        });
    }

    windowResized(sketch) {
        sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);

        /* todo: we should probably recalculate the entities positions here, relative to the new canvas dimensions */
    }

    // resize icons
    resizeIcons() {
        for (let icon in this.iconSet) {
            this.iconSet[icon].resize(20,20);
        }
    }
}




const projectCanvas = new CreativeCodingSurvey();
export default element => {
    console.log('Component mounted on', element);

    let apiURI = 'https://mapping-api.creativecodingutrecht.nl';
    let apiEndpoint = 'responses';
    let responseData;

    loadJSON(`${apiURI}/${apiEndpoint}`, (data) => {
        console.log('fresh live data', data);
        responseData = (!data.error) ? data.data : mockData;
        initialiseSketch(responseData)
    }, (error) => {
        console.log('stale local data', mockData);
        responseData = mockData;
    });


    const initialiseSketch = function(responseData) {
        const thisSketch = ( sketch ) => {
            sketch.setup = () => projectCanvas.setup(sketch, responseData);
            sketch.draw = () => projectCanvas.draw(sketch);
            sketch.windowResized = () => projectCanvas.windowResized(sketch);
            sketch.disableFirendlyErrors = true;
        };

        new P5(thisSketch);
        entities = responseData;
    }

};
