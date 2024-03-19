"use strict";
//version8
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dummy_1 = require("./dummy"); //this is coming from the dummy data
const resolvers = {
    Query: {
        advert: (_1, _a, context_1) => __awaiter(void 0, [_1, _a, context_1], void 0, function* (_, { id }, context) {
            const advert = dummy_1.adverts.find((ad) => ad.id === id);
            return advert;
        }),
        allAdverts: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            return dummy_1.adverts;
        }),
        zone: (_2, _b, context_2) => __awaiter(void 0, [_2, _b, context_2], void 0, function* (_, { id }, context) {
            const zone = dummy_1.zones.find((z) => z.id === id);
            return zone;
        }),
        allZones: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            return dummy_1.zones;
        }),
        campaign: (_3, _c, context_3) => __awaiter(void 0, [_3, _c, context_3], void 0, function* (_, { id }, context) {
            const campaign = dummy_1.campaigns.find((c) => c.id === id);
            return campaign;
        }),
        allCampaigns: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            return dummy_1.campaigns;
        }),
        click: (_4, _d, context_4) => __awaiter(void 0, [_4, _d, context_4], void 0, function* (_, { id }, context) {
            const click = dummy_1.clicks.find((c) => c.id === id);
            return click;
        }),
        allClicks: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            return dummy_1.clicks;
        }),
        conversion: (_5, _e, context_5) => __awaiter(void 0, [_5, _e, context_5], void 0, function* (_, { id }, context) {
            const conversion = dummy_1.conversions.find((c) => c.id === id);
            return conversion;
        }),
        allConversions: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            return dummy_1.conversions;
        }),
        user: (_6, _f, context_6) => __awaiter(void 0, [_6, _f, context_6], void 0, function* (_, { id }, context) {
            const user = dummy_1.users.find((u) => u.id === id);
            return user;
        }),
        // Add resolver for user login here...
    },
    Mutation: {
        createAdvert: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const newAdvert = Object.assign({ id: Math.random().toString() }, args);
            dummy_1.adverts.push(newAdvert);
            return newAdvert;
        }),
        createZone: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const newZone = Object.assign({ id: Math.random().toString() }, args);
            dummy_1.zones.push(newZone);
            return newZone;
        }),
        createCampaign: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const newCampaign = Object.assign({ id: Math.random().toString() }, args);
            dummy_1.campaigns.push(newCampaign);
            return newCampaign;
        }),
        // Add resolvers for click capture and conversion capture here...
    },
};
exports.default = resolvers;
