import Decimal from "decimal.js-light";
import { TEST_FARM } from "features/game/lib/constants";
import { GameState, PlacedItem } from "features/game/types/game";
import { collectCompost } from "./collectCompost";

const GAME_STATE: GameState = TEST_FARM;

describe("collectComposterProduce", () => {
  const dateNow = Date.now();

  it("throws an error if building does not exist", () => {
    expect(() =>
      collectCompost({
        state: {
          ...GAME_STATE,
          buildings: {},
        },
        action: {
          type: "compost.collected",
          building: "Basic Composter",
          buildingId: "123",
        },
        createdAt: Date.now(),
      })
    ).toThrow("Composter does not exist");
  });

  it("throws an error if building is not producing anything", () => {
    expect(() =>
      collectCompost({
        state: {
          ...GAME_STATE,
          buildings: {
            "Basic Composter": [
              {
                id: "123",
                coordinates: { x: 1, y: 1 },
                createdAt: 0,
                readyAt: 0,
              },
            ],
          },
        },
        action: {
          type: "compost.collected",
          building: "Basic Composter",
          buildingId: "123",
        },
        createdAt: Date.now(),
      })
    ).toThrow("Composter is not producing anything");
  });

  it("throws an error if Compost is not ready", () => {
    expect(() =>
      collectCompost({
        state: {
          ...GAME_STATE,
          buildings: {
            "Basic Composter": [
              {
                id: "123",
                coordinates: { x: 1, y: 1 },
                createdAt: 0,
                readyAt: 0,
                producing: {
                  name: "Sprout Mix",
                  readyAt: dateNow + 1000,
                },
              },
            ],
          },
        },
        action: {
          type: "compost.collected",
          building: "Basic Composter",
          buildingId: "123",
        },
        createdAt: Date.now(),
      })
    ).toThrow("Compost is not ready");
  });

  it("removes the Compost from the building", () => {
    const basicComposter: PlacedItem = {
      id: "123",
      coordinates: { x: 1, y: 1 },
      createdAt: 0,
      readyAt: 0,
      producing: {
        name: "Sprout Mix",
        readyAt: dateNow - 1000,
      },
    };
    const state = collectCompost({
      state: {
        ...GAME_STATE,
        buildings: {
          "Basic Composter": [
            basicComposter,
            {
              id: "2039",
              coordinates: { x: 1, y: 1 },
              createdAt: 0,
              readyAt: 0,
            },
          ],
        },
      },
      action: {
        type: "compost.collected",
        building: "Basic Composter",
        buildingId: "123",
      },
      createdAt: Date.now(),
    });

    expect(state.buildings).toEqual({
      "Basic Composter": [
        {
          ...basicComposter,
          producing: undefined,
        },

        {
          id: "2039",
          coordinates: { x: 1, y: 1 },
          createdAt: 0,
          readyAt: 0,
        },
      ],
    });
  });

  it("adds the consumable to the inventory", () => {
    const state = collectCompost({
      state: {
        ...GAME_STATE,
        balance: new Decimal(10),
        inventory: {
          Sunflower: new Decimal(22),
          Earthworm: new Decimal(0),
        },
        buildings: {
          "Basic Composter": [
            {
              id: "123",
              coordinates: { x: 1, y: 1 },
              createdAt: 0,
              readyAt: 0,
              producing: {
                name: "Sprout Mix",
                readyAt: dateNow - 1000,
              },
            },
          ],
        },
      },
      action: {
        type: "compost.collected",
        building: "Basic Composter",
        buildingId: "123",
      },
      createdAt: Date.now(),
    });

    expect(state.balance).toEqual(new Decimal(10));
    expect(state.inventory).toEqual({
      "Sprout Mix": new Decimal(10),
      Earthworm: new Decimal(1),
      Sunflower: new Decimal(22),
    });
  });
});
