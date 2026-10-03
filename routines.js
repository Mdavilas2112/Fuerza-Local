const ROUTINES={
 monday:{id:'monday',day:'LUNES',name:'Torso A',duration:'60–70 min',warmup:'6–8 min',rir:'RIR 1–2',flow:'1 ronda = ejercicio 1 → 20–30 s → ejercicio 2 → descanso',setup:'Polea al suelo en A · un cambio a ALTA antes de B · sin cambios dentro de las parejas',between:'Entre bloques: 120–180 s, sustituyendo el último descanso.',exercises:[
  {id:'flat_press',code:'A1',name:'Press plano con mancuernas',sets:3,min:8,max:12,rest:25,restLabel:'20–30 s → A2',pair:'A',note:'Pies firmes; muñecas sobre codos y escápulas apoyadas.'},
  {id:'row_low',code:'A2',name:'Remo sentado · polea al suelo',sets:3,min:8,max:12,rest:120,restLabel:'120 s · hasta 180 s si lo necesitas',pair:'A',note:'Pies en el apoyapiés; rodillas suaves y torso estable.'},
  {id:'incline_press',code:'B1',name:'Press inclinado · 20–30°',sets:3,min:8,max:12,rest:25,restLabel:'20–30 s → B2',pair:'B',note:'Banco a 20–30°; pies firmes y bajada controlada.'},
  {id:'pulldown',code:'B2',name:'Jalón al pecho sentado en banca',sets:3,min:8,max:12,rest:120,restLabel:'120 s · hasta 180 s si lo necesitas',pair:'B',note:'Caderas apoyadas; barra al pecho alto, sin balanceo.'},
  {id:'curl_supinated',code:'C1',name:'Curl supinado con mancuernas',sets:4,min:8,max:12,rest:25,restLabel:'20–30 s → C2',pair:'C',note:'Palmas arriba; codos estables y sin impulso.'},
  {id:'triceps_pushdown',code:'C2',name:'Tríceps con cuerda · polea alta',sets:4,min:10,max:15,rest:90,restLabel:'90–120 s',pair:'C',note:'Codos junto al torso; extiende abajo sin mover hombros.'},
  {id:'lateral_raise',code:'D1',name:'Elevaciones laterales con mancuernas',sets:3,min:12,max:20,rest:25,restLabel:'20–30 s → D2',pair:'D',note:'Brazos un poco al frente; sube hasta el hombro.'},
  {id:'reverse_crunch',code:'D2',name:'Crunch inverso en colchoneta',sets:3,min:10,max:15,rest:75,restLabel:'75–90 s',pair:'D',note:'Acerca la pelvis a las costillas, sin balancear las piernas.',bodyweight:true}
 ]},
 wednesday:{id:'wednesday',day:'MIÉRCOLES',name:'Pierna + Hombros + Brazos',duration:'60–70 min',warmup:'6–8 min',rir:'Goblet y rumano RIR 2–3 · resto RIR 1–2',flow:'1 ronda = ejercicio 1 → 20–30 s → ejercicio 2 → descanso',setup:'Polea ALTA en A2 y C2 · misma altura y cuerda durante la sesión',between:'Entre bloques: 120–180 s, sustituyendo el último descanso.',exercises:[
  {id:'goblet_squat',code:'A1',name:'Sentadilla goblet',sets:3,min:10,max:15,rest:25,restLabel:'20–30 s → A2',pair:'A',rir:'2–3',note:'Rodillas siguen a los pies; apoyo firme y profundidad cómoda.'},
  {id:'face_pull',code:'A2',name:'Face pull con cuerda · polea alta',sets:3,min:12,max:20,rest:120,restLabel:'120 s · hasta 180 s si lo necesitas',pair:'A',note:'Cuerda hacia la frente; torso estable y hombros sin encoger.'},
  {id:'rdl',code:'B1',name:'Peso muerto rumano con mancuernas',sets:3,min:8,max:12,rest:25,restLabel:'20–30 s → B2',pair:'B',rir:'2–3',note:'Cadera atrás; rodillas suaves y pesas cerca de las piernas.'},
  {id:'lateral_raise',code:'B2',name:'Elevaciones laterales con mancuernas',sets:3,min:12,max:20,rest:120,restLabel:'120 s · hasta 180 s si lo necesitas',pair:'B',note:'Brazos un poco al frente; sube hasta el hombro.'},
  {id:'curl_hammer',code:'C1',name:'Curl martillo con mancuernas',sets:4,min:10,max:15,rest:25,restLabel:'20–30 s → C2',pair:'C',note:'Palmas enfrentadas; codos estables y sin impulso.'},
  {id:'triceps_overhead',code:'C2',name:'Tríceps sobre cabeza · polea alta',sets:4,min:10,max:15,rest:90,restLabel:'90–120 s',pair:'C',note:'De espaldas a la torre; brazos estables y extiende los codos.'},
  {id:'calf_seated',code:'D1',name:'Pantorrillas sentado con mancuernas',sets:3,min:12,max:20,rest:25,restLabel:'20–30 s → D2',pair:'D',note:'Carga sobre muslos; eleva talones y baja sin rebote.'},
  {id:'reverse_crunch',code:'D2',name:'Crunch inverso en colchoneta',sets:3,min:10,max:15,rest:75,restLabel:'75–90 s',pair:'D',note:'Acerca la pelvis a las costillas, sin balancear las piernas.',bodyweight:true}
 ]},
 friday:{id:'friday',day:'VIERNES',name:'Torso B',duration:'60–70 min',warmup:'6–8 min',rir:'RIR 1–2',flow:'1 ronda = ejercicio 1 → 20–30 s → ejercicio 2 → descanso',setup:'Polea al suelo en A · un cambio a ALTA antes de B · sin cambios dentro de las parejas',between:'Entre bloques: 120–180 s, sustituyendo el último descanso.',exercises:[
  {id:'incline_press',code:'A1',name:'Press inclinado · 20–30°',sets:3,min:8,max:12,rest:25,restLabel:'20–30 s → A2',pair:'A',note:'Banco a 20–30°; pies firmes y bajada controlada.'},
  {id:'row_low',code:'A2',name:'Remo sentado · polea al suelo',sets:3,min:8,max:12,rest:120,restLabel:'120 s · hasta 180 s si lo necesitas',pair:'A',note:'Pies en el apoyapiés; rodillas suaves y torso estable.'},
  {id:'flat_press',code:'B1',name:'Press plano con mancuernas',sets:3,min:8,max:12,rest:25,restLabel:'20–30 s → B2',pair:'B',note:'Pies firmes; muñecas sobre codos y escápulas apoyadas.'},
  {id:'pulldown',code:'B2',name:'Jalón al pecho sentado en banca',sets:3,min:8,max:12,rest:120,restLabel:'120 s · hasta 180 s si lo necesitas',pair:'B',note:'Caderas apoyadas; barra al pecho alto, sin balanceo.'},
  {id:'curl_supinated',code:'C1',name:'Curl supinado con mancuernas',sets:4,min:8,max:12,rest:25,restLabel:'20–30 s → C2',pair:'C',note:'Palmas arriba; codos estables y sin impulso.'},
  {id:'triceps_overhead',code:'C2',name:'Tríceps sobre cabeza · polea alta',sets:4,min:10,max:15,rest:90,restLabel:'90–120 s',pair:'C',note:'De espaldas a la torre; brazos estables y extiende los codos.'},
  {id:'lateral_raise',code:'D1',name:'Elevaciones laterales con mancuernas',sets:3,min:12,max:20,rest:25,restLabel:'20–30 s → D2',pair:'D',note:'Brazos un poco al frente; sube hasta el hombro.'},
  {id:'reverse_crunch',code:'D2',name:'Crunch inverso en colchoneta',sets:3,min:10,max:15,rest:75,restLabel:'75–90 s',pair:'D',note:'Acerca la pelvis a las costillas, sin balancear las piernas.',bodyweight:true}
 ]}
};
const ROUTINE_IDS=['monday','wednesday','friday'];