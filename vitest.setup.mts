import { getRandomValues, randomUUID, subtle } from "node:crypto";

globalThis.crypto = { subtle, getRandomValues, randomUUID };
