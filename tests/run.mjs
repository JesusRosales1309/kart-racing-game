// Run with Node.js 18+: node tests/run.mjs. No npm dependencies.
import {readFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html'),scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const simulation=html.split('<script id="simulation">')[1].split('</script>')[0],presentation=scripts.at(-1),vehicles=read('vehicles.js'),showroom=read('showroom.js'),track=read('track.js'),effects=read('effects.js'),audio=read('audio.js');
for(const source of [...scripts,vehicles,showroom,track,effects,audio])new Function(source);
const baseline=read('tests/baseline-physics.js');
// Only boundary coordinates changed in movement; acceleration/grip/drift/boost remain identical.
const move=s=>s.slice(s.indexOf(' race.move='),s.indexOf(' race.step=')).replace(/const x=clamp\(c.x,[^;]+;/,'BOUNDARY;');
assert.equal(move(simulation),move(baseline),'Driving equations preserved');
const run=new Function(read('tests/runtime-harness.js')+';return runVehicleChecks;')();
console.log(JSON.stringify(run(simulation,presentation,vehicles,showroom,track,effects,audio),null,2));
const trackChecks=new Function(read('tests/track-checks.js')+';return runTrackChecks;')();
console.log(trackChecks(track,simulation));
console.log('PASS: syntax, preserved driving equations, selector, rival models, AI, checkpoints and races.');
console.log('DOM/Three doubles do not validate GPU, layout, hardware controllers or a physical iPhone.');

const h=new Function(read('tests/runtime-harness.js')+';return createHarness();')();
const core=new Function(track+simulation+';return KartCore;')();
const feedbackChecks=new Function(read('tests/feedback-checks.js')+';return runFeedbackChecks;')();
console.log(feedbackChecks(h.THREE,effects,audio,core));
