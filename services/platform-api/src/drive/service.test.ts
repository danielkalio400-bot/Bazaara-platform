import assert from "node:assert/strict";
import test from "node:test";
import { DRIVE_DRIVER_CANCEL_FEE_BPS, DRIVE_DROPOFF_VIOLATION_FEE_BPS, DRIVE_PLATFORM_FEE_BPS, calculateDrivePrice, haversineMeters } from "./service.js";
test("Drive pricing keeps frozen 15% platform economics",()=>{const q=calculateDrivePrice({rideClass:"GO",distanceMeters:5000,durationSeconds:900,fuelIndexBps:11000});assert.equal(q.platformFeeBps,DRIVE_PLATFORM_FEE_BPS);assert.ok(q.fuelAdjustmentMinor>0n);assert.equal(q.platformFeeMinor+q.driverEarningsMinor,q.totalMinor);assert.equal(Number(q.platformFeeMinor),Math.round(Number(q.totalMinor)*.15))});
test("fuel price decreases reduce new quotes",()=>{const a=calculateDrivePrice({rideClass:"GO",distanceMeters:5000,durationSeconds:900,fuelIndexBps:10000});const b=calculateDrivePrice({rideClass:"GO",distanceMeters:5000,durationSeconds:900,fuelIndexBps:9000});assert.ok(b.totalMinor<a.totalMinor)});
test("destination geodesic distance is stable",()=>{const d=haversineMeters({latitude:7.3775,longitude:3.9470},{latitude:7.3780,longitude:3.9470});assert.ok(d>40&&d<80)});
test("enforcement rates remain 10% cancellation and 20% dropoff",()=>{assert.equal(DRIVE_DRIVER_CANCEL_FEE_BPS,1000);assert.equal(DRIVE_DROPOFF_VIOLATION_FEE_BPS,2000)});
