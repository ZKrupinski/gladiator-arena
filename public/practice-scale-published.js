/* 31 author-approved Spartacus fighter, beast and executioner sizes and foot heights.
 * Repository source-of-truth: GitHub main. No credentials stored.
 */
(function(root){"use strict";root.SpartacusPublishedScales=Object.freeze({
  "murmillo_a_L1": 1.35,
  "murmillo_a_L2": 1.15,
  "murmillo_a_L3": 1.26,
  "murmillo_a_L4": 1.1,
  "murmillo_a_L5": 1.12,
  "thraex_a_L1": 1.4,
  "thraex_a_L2": 1.34,
  "thraex_a_L3": 1.26,
  "thraex_a_L4": 1.3,
  "thraex_a_L5": 1.36,
  "thraex_b_L1": 1.3,
  "thraex_b_L2": 1.3,
  "thraex_b_L3": 1.26,
  "thraex_b_L4": 1.25,
  "thraex_b_L5": 1.24,
  "retiarius_a_L1": 1.36,
  "retiarius_a_L2": 1.34,
  "retiarius_a_L3": 1.29,
  "retiarius_a_L4": 1.26,
  "retiarius_a_L5": 1.37,
  "murmillo_champion_red": 1.66,
  "murmillo_redcrest_new_v1": 1.48,
  "murmillo_redcrest_alt_v1": 1.43,
  "murmillo_motion_v3": 1.12,
  "legacy_murmillo": 1.6,
  "legacy_thraex": 1.72,
  "legacy_retiarius": 1.68,
  "beast_wolf": 1.64,
  "beast_leopard": 1.67,
  "beast_tiger": 1.67,
  "beast_lion": 1.71,
  "beast_elephant": 1.65,
  "npc_carnifex": 1.08
});root.SpartacusPublishedFeet=Object.freeze({
  "murmillo_a_L1": 0,
  "murmillo_a_L2": 0,
  "murmillo_a_L3": 0,
  "murmillo_a_L4": 0,
  "murmillo_a_L5": 0,
  "thraex_a_L1": 0,
  "thraex_a_L2": 0,
  "thraex_a_L3": 0,
  "thraex_a_L4": 0,
  "thraex_a_L5": 0,
  "thraex_b_L1": 0,
  "thraex_b_L2": 0,
  "thraex_b_L3": 0,
  "thraex_b_L4": 0,
  "thraex_b_L5": 0,
  "retiarius_a_L1": 0,
  "retiarius_a_L2": 0,
  "retiarius_a_L3": 0,
  "retiarius_a_L4": 0,
  "retiarius_a_L5": 0,
  "murmillo_champion_red": 0,
  "murmillo_redcrest_new_v1": 0,
  "murmillo_redcrest_alt_v1": 0,
  "murmillo_motion_v3": 0,
  "legacy_murmillo": 0,
  "legacy_thraex": 0,
  "legacy_retiarius": 0,
  "beast_wolf": -1,
  "beast_leopard": -5,
  "beast_tiger": -5,
  "beast_lion": -5,
  "beast_elephant": -5,
  "npc_carnifex": -10
});root.SpartacusPublishedActions=Object.freeze({
  "murmillo_a_L1": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        },
        "keys": [
          {
            "t": 0,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.5,
            "x": 0,
            "y": 0
          },
          {
            "t": 1,
            "x": 0,
            "y": 0
          }
        ],
        "interpolation": "ease"
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": -14
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "murmillo_a_L2": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "murmillo_a_L3": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "murmillo_a_L4": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "murmillo_a_L5": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_a_L1": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_a_L2": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_a_L3": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_a_L4": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_a_L5": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_b_L1": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_b_L2": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_b_L3": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_b_L4": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "thraex_b_L5": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "retiarius_a_L1": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "retiarius_a_L2": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "retiarius_a_L3": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "retiarius_a_L4": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "retiarius_a_L5": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "murmillo_champion_red": {
    "attack": {
      "x": 117,
      "y": 7,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        },
        "keys": [
          {
            "t": 0,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.478,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.498,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.5,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.576,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.584,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.602,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.643,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.664,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.673,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.7,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.726,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.868,
            "x": 0,
            "y": 0
          },
          {
            "t": 1,
            "x": 0,
            "y": 0
          }
        ],
        "interpolation": "smooth"
      }
    },
    "slash": {
      "x": 117,
      "y": 7,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        },
        "keys": [
          {
            "t": 0,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.478,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.498,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.5,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.576,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.584,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.602,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.643,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.664,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.673,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.7,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.726,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.868,
            "x": 0,
            "y": 0
          },
          {
            "t": 1,
            "x": 0,
            "y": 0
          }
        ],
        "interpolation": "smooth"
      }
    },
    "sweep": {
      "x": 117,
      "y": 7,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        },
        "keys": [
          {
            "t": 0,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.478,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.498,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.5,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.576,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.584,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.602,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.643,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.664,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.673,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.7,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.726,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.868,
            "x": 0,
            "y": 0
          },
          {
            "t": 1,
            "x": 0,
            "y": 0
          }
        ],
        "interpolation": "smooth"
      }
    },
    "thrust": {
      "x": 117,
      "y": 7,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        },
        "keys": [
          {
            "t": 0,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.478,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.498,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.5,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.576,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.584,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.602,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.643,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.664,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.673,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.7,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.726,
            "x": 0,
            "y": 0
          },
          {
            "t": 0.868,
            "x": 0,
            "y": 0
          },
          {
            "t": 1,
            "x": 0,
            "y": 0
          }
        ],
        "interpolation": "smooth"
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "murmillo_redcrest_new_v1": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 93,
      "y": 8,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "murmillo_redcrest_alt_v1": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "murmillo_motion_v3": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "legacy_murmillo": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "legacy_thraex": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  },
  "legacy_retiarius": {
    "idle": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "walk": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "attack": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 52,
        "y": -12,
        "scale": 1.13,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "slash": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 35,
        "y": 5,
        "scale": 1.18,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "sweep": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -29,
        "scale": 1.27,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "thrust": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -54,
        "y": 20,
        "scale": 1.53,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "heavy": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 164,
        "y": -21,
        "scale": 1.09,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "special": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 157,
        "y": -24,
        "scale": 1.33,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "guard": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 33,
        "y": 20,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "parry": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 101,
        "y": -26,
        "scale": 1.28,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "dodge": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "hit": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 111,
        "y": -21,
        "scale": 1.3,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "death": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 0,
        "y": 0,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "finisher": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": 180,
        "y": -65,
        "scale": 1.01,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    },
    "victory": {
      "x": 0,
      "y": 0,
      "scale": 1,
      "effect": {
        "kind": "auto",
        "x": -49,
        "y": -60,
        "scale": 1,
        "direction": "follow"
      },
      "motion": {
        "start": {
          "x": 0,
          "y": 0
        },
        "middle": {
          "x": 0,
          "y": 0
        },
        "end": {
          "x": 0,
          "y": 0
        }
      }
    }
  }
});root.SpartacusPublishedMarketPrices=Object.freeze({
  "murmillo_a_L1": 1,
  "murmillo_a_L2": 2,
  "murmillo_a_L3": 2,
  "murmillo_a_L4": 3,
  "murmillo_a_L5": 3,
  "thraex_a_L1": 1,
  "thraex_a_L2": 2,
  "thraex_a_L3": 2,
  "thraex_a_L4": 3,
  "thraex_a_L5": 3,
  "thraex_b_L1": 1,
  "thraex_b_L2": 2,
  "thraex_b_L3": 2,
  "thraex_b_L4": 3,
  "thraex_b_L5": 3,
  "retiarius_a_L1": 1,
  "retiarius_a_L2": 2,
  "retiarius_a_L3": 2,
  "retiarius_a_L4": 3,
  "retiarius_a_L5": 3,
  "murmillo_champion_red": 5,
  "murmillo_redcrest_new_v1": 4,
  "murmillo_redcrest_alt_v1": 4,
  "murmillo_motion_v3": 4,
  "legacy_murmillo": 3,
  "legacy_thraex": 3,
  "legacy_retiarius": 3
});root.SpartacusPublishedGladiators=Object.freeze([]);})(typeof window!=="undefined"?window:globalThis);
