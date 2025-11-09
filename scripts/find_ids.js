const fs = require('fs');
const path = './public/db/espn/nfl/player_index.json';
const names = ['Trent Williams','Josh Allen','Derrick Henry','Trey McBride','Justin Jefferson','Quinnen Williams','Alex Anzalone','Sauce Gardner'];
(async ()=>{
  try{
    const raw = fs.readFileSync(path,'utf8');
    const json = JSON.parse(raw);
    const byId = json.byId || {};
    const found = {};
    for(const id of Object.keys(byId)){
      const p = byId[id];
      if(!p || !p.name) continue;
      for(const n of names){
        if(p.name.toLowerCase() === n.toLowerCase()) found[n]=id;
      }
    }
    // also try scanning list array if present
    if(!Object.keys(found).length && json.list){
      for(const p of json.list){
        for(const n of names) if(p.name && p.name.toLowerCase()===n.toLowerCase()) found[n]=p.id;
      }
    }
    console.log(found);
  }catch(e){console.error(e);process.exit(1);} 
})();
