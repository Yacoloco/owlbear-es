import { travelPace } from './tables/travelPace.js';
import { servicesAndTransportation } from './tables/transportation.js';
import { foodAndDrink } from './tables/foodAndDrink.js';
import { objectHP } from './tables/objectHP.js';
import { objectAC } from './tables/objectAC.js';
import { trackingDC } from './tables/trackingDC.js';
import { settingDC } from './tables/settingDC.js';
import { actionList } from './tables/actionList.js';
import { cover } from './tables/cover.js';
import { conditions } from './tables/conditions.js';
import { outdoorVisibility } from './tables/outdoorVisibility.js';
import { audibleDistance } from './tables/audibleDistance.js';
import { encounterDistance } from './tables/encounterDistance.js';
import { damageSeverity } from './tables/damageSeverity.js';
import { lightSources } from './tables/lightSources.js';
import { skills } from './tables/skills.js';
import { jumping } from './tables/jumping.js';
import { concentration } from './tables/concentration.js';
import { thingsYouCanDo } from './tables/thingsYouCanDo.js';
import { attribution } from './tables/attribution.js';


const container = document.createElement('div');
container.id = 'container';

const cards = [
  settingDC,
  cover,
  damageSeverity,
  objectAC,
  objectHP,
  jumping,
  trackingDC,
  travelPace,
  outdoorVisibility,
  audibleDistance,
  encounterDistance,
  lightSources,
  concentration,
  thingsYouCanDo,
  actionList,
  conditions,
  foodAndDrink,
  servicesAndTransportation,
  skills,
  attribution,
];

cards.forEach(card => {
  container.appendChild(card());
});

document.querySelector('#app').appendChild(container);