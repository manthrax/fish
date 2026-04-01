export const SimConfigDefaults = {
    SEED: 12345,
    NUM_FISH: 1500,
    CORAL_COUNT: 120,
    CORAL_SCALE: 200,
    CORAL_SCALE_VAR: 300,
    duneColor: '#bcb188',
    TICK_RATE: 1
};

let savedConfigText;// = sessionStorage.getItem('fishSimConfig');
let savedConfig = savedConfigText ? JSON.parse(savedConfigText) : {};
export const SimConfig = { ...SimConfigDefaults, ...savedConfig };

if (typeof window !== "undefined") {
    window.SimConfig = SimConfig;
}

let FishParams = {
    NUM_FISH: SimConfig.NUM_FISH,
    HIGH_RES_FISH: true,
    UPDATE_FISH: true,

    swarmRadius: 50,
    swarmHeight: 5,
    swarmSpawnRadius: 50.,
    oceanSurfaceY: 50,
    oceanFloorY: 1,
    fishSpeedMult: 1.0,

    0: {
        baseScale: 1.5
    },
    1: {
        name: "pallete surgeonfish-blue tang-dory",
        baseScale: 1.3
    },
    2: {
        baseScale: .5
    },
    3: {
        baseScale: .35
    },
    4: {
        name: "yellow tang",
        baseScale: 1.1
    },
    5: {
        baseScale: 1.
    },
    6: {
        baseScale: .7
    },
    7: {
        baseScale: .95
    },
    8: {
        baseScale: .8
    },

    9: {
        baseScale: .6
    },
    10: {
        baseScale: .7
    },
    11: {
        //clown
        name: "false-nemo",
        baseScale: .4
    },
    12: {
        name:'ghosty-whitefish',
        baseScale: .8
    },
    13: {
        name:'ghosty-whitefish',
        baseScale: .3
    },
    14: {
        name:'rainbow-greeble',
        baseScale: 2.3
    },
    15: {
        name:'whitetip-shark',
        baseScale: 2.3
    },
}

export default FishParams;
