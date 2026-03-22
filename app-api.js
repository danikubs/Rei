const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const appApiRouter = express.Router();
const storePath = path.join(__dirname, "app-store.json");
const FIXED_LOGIN_EMAIL = "productor@gmail.com";
const FIXED_LOGIN_PASSWORD = "ILOVEBAF";
const FIXED_USER_ID = "usr_productor_fixed";

const DIAGNOSTICS = [
  { level: 1, title: "Registro básico", description: "Datos generales del animal", score: 15 },
  { level: 2, title: "Salud inicial", description: "Vacunación y estado sanitario", score: 20 },
  { level: 3, title: "Alimentación", description: "Dieta, consumo y conversión", score: 20 },
  { level: 4, title: "Ambiente", description: "Infraestructura y bioseguridad", score: 20 },
  { level: 5, title: "Productividad", description: "Rendimiento y proyección", score: 25 },
];

function getDefaultStore() {
  return {
    users: [],
    animals: [],
    sessions: {},
    wallets: {},
  };
}

function loadStore() {
  if (!fs.existsSync(storePath)) {
    const defaultStore = getDefaultStore();
    fs.writeFileSync(storePath, JSON.stringify(defaultStore, null, 2), "utf8");
    return defaultStore;
  }

  const raw = fs.readFileSync(storePath, "utf8");
  return JSON.parse(raw);
}

function saveStore(store) {
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
}

function createWallet() {
  return {
    mxnBalance: 0,
    mxneBalance: 0,
    movements: [],
    poolContracts: [],
  };
}

function buildBaseUser({ name, email, password = "", phone = "", loginProvider = "password", walletAddress = "" }) {
  return {
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name,
    email: email.toLowerCase(),
    password,
    phone,
    category: null,
    subcategory: null,
    loginProvider,
    walletAddress,
    createdAt: new Date().toISOString(),
  };
}

function ensureWalletForUser(store, userId) {
  if (!store.wallets[userId]) {
    store.wallets[userId] = createWallet();
  }
}

function ensureFixedUser(store) {
  let user = store.users.find((item) => item.id === FIXED_USER_ID);
  if (!user) {
    user = {
      id: FIXED_USER_ID,
      name: "Productor REI",
      email: FIXED_LOGIN_EMAIL,
      password: FIXED_LOGIN_PASSWORD,
      phone: "",
      category: null,
      subcategory: null,
      loginProvider: "password",
      walletAddress: "",
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
  } else {
    user.email = FIXED_LOGIN_EMAIL;
    user.password = FIXED_LOGIN_PASSWORD;
    user.loginProvider = "password";
    user.name = user.name || "Productor REI";
  }
  ensureWalletForUser(store, user.id);
  return user;
}

function ensureWalletUserByAddress(store, walletAddress, provider = "stellar-wallet-kit") {
  const normalized = String(walletAddress || "").trim().toUpperCase();
  const isValidStellarPublicKey = /^G[A-Z2-7]{55}$/.test(normalized);
  if (!isValidStellarPublicKey) {
    throw new Error("Dirección de wallet Stellar inválida.");
  }

  let user = store.users.find((item) => item.walletAddress === normalized);
  if (!user) {
    user = buildBaseUser({
      name: `Productor ${normalized.slice(0, 6)}`,
      email: `${normalized.slice(0, 12).toLowerCase()}@wallet.stellar`,
      loginProvider: provider,
      walletAddress: normalized,
    });
    store.users.push(user);
  } else {
    user.loginProvider = provider;
    user.walletAddress = normalized;
  }

  ensureWalletForUser(store, user.id);
  return user;
}

function stellarTxHash() {
  return crypto.randomBytes(16).toString("hex");
}

function withAuth(req, res, handler) {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    res.status(401).json({ error: "x-user-id es requerido" });
    return;
  }

  const store = loadStore();
  const user = store.users.find((item) => item.id === userId);
  if (!user) {
    res.status(401).json({ error: "Sesión inválida" });
    return;
  }

  handler(store, user);
}

appApiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "rei-app-api" });
});

appApiRouter.post("/auth/register", (req, res) => {
  res.status(403).json({
    error: "Registro deshabilitado. Usa solo el inicio de sesión autorizado.",
  });
});

appApiRouter.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  const store = loadStore();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "").trim();

  if (normalizedEmail !== FIXED_LOGIN_EMAIL || normalizedPassword !== FIXED_LOGIN_PASSWORD) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const user = ensureFixedUser(store);
  saveStore(store);
  res.json({ userId: user.id, name: user.name, email: user.email });
});

appApiRouter.post("/auth/google", (_req, res) => {
  res.status(403).json({
    error: "Inicio de sesión con Google deshabilitado.",
  });
});

appApiRouter.post("/auth/wallet", (req, res) => {
  try {
    const store = loadStore();
    const user = ensureWalletUserByAddress(
      store,
      req.body.walletAddress,
      req.body.provider || "stellar-wallet-kit"
    );
    saveStore(store);
    res.json({
      userId: user.id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      provider: user.loginProvider,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "No se pudo iniciar sesión con wallet" });
  }
});

appApiRouter.post("/auth/lobstr", (req, res) => {
  try {
    const store = loadStore();
    const user = ensureWalletUserByAddress(store, req.body.walletAddress, "lobstr");
    saveStore(store);
    res.json({
      userId: user.id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      provider: user.loginProvider,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "No se pudo iniciar sesión con LOBSTR" });
  }
});

appApiRouter.get("/dashboard", (req, res) => {
  withAuth(req, res, (store, user) => {
    const animals = store.animals.filter((item) => item.ownerId === user.id);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        category: user.category,
        subcategory: user.subcategory,
      },
      totals: {
        activos: animals.length,
        contratos: animals.filter((item) => item.score >= 100).length,
      },
    });
  });
});

appApiRouter.post("/category", (req, res) => {
  withAuth(req, res, (store, user) => {
    user.category = req.body.category || null;
    saveStore(store);
    res.json({ ok: true, category: user.category });
  });
});

appApiRouter.post("/subcategory", (req, res) => {
  withAuth(req, res, (store, user) => {
    user.subcategory = req.body.subcategory || null;
    saveStore(store);
    res.json({ ok: true, subcategory: user.subcategory });
  });
});

appApiRouter.post("/animals", (req, res) => {
  withAuth(req, res, (store, user) => {
    const body = req.body;
    if (!body.type || !body.identifier || !body.purpose) {
      res.status(400).json({ error: "Tipo, identificador y propósito son obligatorios" });
      return;
    }

    const animal = {
      id: `ani_${Date.now()}`,
      ownerId: user.id,
      type: body.type,
      quantity: Number(body.quantity || 1),
      purpose: body.purpose,
      breed: body.breed || "",
      identifier: body.identifier,
      ageWeeks: Number(body.ageWeeks || 0),
      weightKg: Number(body.weightKg || 0),
      condition: body.condition || "Regular",
      origin: body.origin || "",
      responsiblePhone: body.responsiblePhone || "",
      diagnosticsCompleted: [],
      score: 0,
      createdAt: new Date().toISOString(),
    };

    store.animals.push(animal);
    saveStore(store);
    res.json({ ok: true, animal });
  });
});

appApiRouter.get("/animals", (req, res) => {
  withAuth(req, res, (store, user) => {
    const animals = store.animals.filter((item) => item.ownerId === user.id);
    res.json({ animals });
  });
});

appApiRouter.get("/animals/:animalId", (req, res) => {
  withAuth(req, res, (store, user) => {
    const animal = store.animals.find(
      (item) => item.id === req.params.animalId && item.ownerId === user.id
    );
    if (!animal) {
      res.status(404).json({ error: "Activo no encontrado" });
      return;
    }

    res.json({
      animal,
      diagnostics: DIAGNOSTICS.map((diag) => ({
        ...diag,
        completed: animal.diagnosticsCompleted.includes(diag.level),
      })),
    });
  });
});

appApiRouter.post("/animals/:animalId/diagnostics/:level", (req, res) => {
  withAuth(req, res, (store, user) => {
    const animal = store.animals.find(
      (item) => item.id === req.params.animalId && item.ownerId === user.id
    );
    if (!animal) {
      res.status(404).json({ error: "Activo no encontrado" });
      return;
    }

    const level = Number(req.params.level);
    if (!DIAGNOSTICS.some((diag) => diag.level === level)) {
      res.status(400).json({ error: "Nivel inválido" });
      return;
    }

    if (!animal.diagnosticsCompleted.includes(level)) {
      animal.diagnosticsCompleted.push(level);
    }

    animal.score = DIAGNOSTICS.filter((diag) =>
      animal.diagnosticsCompleted.includes(diag.level)
    ).reduce((acc, current) => acc + current.score, 0);

    saveStore(store);
    res.json({ ok: true, score: animal.score });
  });
});

appApiRouter.get("/animals/:animalId/finance", (req, res) => {
  withAuth(req, res, (store, user) => {
    const animal = store.animals.find(
      (item) => item.id === req.params.animalId && item.ownerId === user.id
    );
    if (!animal) {
      res.status(404).json({ error: "Activo no encontrado" });
      return;
    }

    const contractValueMxn = Math.max(500, animal.weightKg * 52 * 14 + animal.score * 4);
    const productionCostMxn = Math.round(contractValueMxn * 0.42);
    const expectedNetMxn = Math.round(contractValueMxn - productionCostMxn);
    const apr = Math.max(3.5, Math.min(14.9, 4 + animal.score * 0.035));
    const expirationDays = Math.max(7, 35 - Math.floor(animal.score / 4));

    res.json({
      animalId: animal.id,
      contractValueMxn: Math.round(contractValueMxn),
      productionCostMxn,
      expectedNetMxn,
      apr: Number(apr.toFixed(1)),
      expirationDays,
      marketPricePerKg: 52,
      canInvest: animal.score >= 100,
    });
  });
});

appApiRouter.get("/wallet", (req, res) => {
  withAuth(req, res, (store, user) => {
    if (!store.wallets[user.id]) {
      store.wallets[user.id] = createWallet();
      saveStore(store);
    }

    res.json(store.wallets[user.id]);
  });
});

appApiRouter.post("/wallet/deposit-mxne", (req, res) => {
  withAuth(req, res, (store, user) => {
    const amount = Number(req.body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Monto inválido" });
      return;
    }

    if (!store.wallets[user.id]) {
      store.wallets[user.id] = createWallet();
    }

    const txHash = stellarTxHash();
    const wallet = store.wallets[user.id];
    wallet.mxneBalance += amount;
    wallet.mxnBalance += amount;
    wallet.movements.unshift({
      id: `mov_${Date.now()}`,
      type: "deposit",
      amount,
      currency: "MXNe",
      provider: "Etherfuse",
      network: "Stellar",
      txHash,
      createdAt: new Date().toISOString(),
      note: "Depósito MXN tokenizado (MXNe) acreditado",
    });

    saveStore(store);
    res.json({
      ok: true,
      txHash,
      wallet,
      message: "Depósito confirmado en Stellar usando flujo MXNe/Etherfuse",
    });
  });
});

appApiRouter.post("/wallet/withdraw-mxne", (req, res) => {
  withAuth(req, res, (store, user) => {
    const amount = Number(req.body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "Monto inválido" });
      return;
    }

    if (!store.wallets[user.id]) {
      store.wallets[user.id] = createWallet();
    }

    const wallet = store.wallets[user.id];
    if (wallet.mxneBalance < amount) {
      res.status(400).json({ error: "Saldo MXNe insuficiente" });
      return;
    }

    const txHash = stellarTxHash();
    wallet.mxneBalance -= amount;
    wallet.mxnBalance -= amount;
    wallet.movements.unshift({
      id: `mov_${Date.now()}`,
      type: "withdraw",
      amount,
      currency: "MXNe",
      provider: "Etherfuse",
      network: "Stellar",
      txHash,
      createdAt: new Date().toISOString(),
      note: "Retiro a pesos mexicanos (off-ramp)",
    });

    saveStore(store);
    res.json({
      ok: true,
      txHash,
      wallet,
      message: "Retiro iniciado hacia MXN vía rampa Etherfuse",
    });
  });
});

appApiRouter.post("/wallet/pool/deposit-contract", (req, res) => {
  withAuth(req, res, (store, user) => {
    const animal = store.animals.find(
      (item) => item.id === req.body.animalId && item.ownerId === user.id
    );
    if (!animal) {
      res.status(404).json({ error: "Activo no encontrado" });
      return;
    }

    if (animal.score < 100) {
      res.status(400).json({ error: "El activo debe tener score 100 para entrar al pool" });
      return;
    }

    if (!store.wallets[user.id]) {
      store.wallets[user.id] = createWallet();
    }

    const wallet = store.wallets[user.id];
    if (wallet.poolContracts.includes(animal.id)) {
      res.status(400).json({ error: "El contrato ya está en el pool" });
      return;
    }

    wallet.poolContracts.push(animal.id);
    wallet.movements.unshift({
      id: `mov_${Date.now()}`,
      type: "pool_deposit",
      amount: 0,
      currency: "MXNe",
      provider: "REI Pool",
      network: "Stellar",
      txHash: stellarTxHash(),
      createdAt: new Date().toISOString(),
      note: `Contrato ${animal.identifier} depositado en pool`,
    });

    saveStore(store);
    res.json({ ok: true, wallet });
  });
});

appApiRouter.post("/wallet/pool/withdraw-contract", (req, res) => {
  withAuth(req, res, (store, user) => {
    if (!store.wallets[user.id]) {
      store.wallets[user.id] = createWallet();
    }

    const wallet = store.wallets[user.id];
    const animalId = String(req.body.animalId || "");
    if (!wallet.poolContracts.includes(animalId)) {
      res.status(400).json({ error: "El contrato no está en el pool" });
      return;
    }

    wallet.poolContracts = wallet.poolContracts.filter((item) => item !== animalId);
    wallet.movements.unshift({
      id: `mov_${Date.now()}`,
      type: "pool_withdraw",
      amount: 0,
      currency: "MXNe",
      provider: "REI Pool",
      network: "Stellar",
      txHash: stellarTxHash(),
      createdAt: new Date().toISOString(),
      note: `Retiro de contrato ${animalId} del pool (requiere liquidación de obligaciones)`,
    });

    saveStore(store);
    res.json({ ok: true, wallet });
  });
});

module.exports = { appApiRouter };
