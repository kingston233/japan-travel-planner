import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ─── Types ────────────────────────────────────────────────────────────────────

interface Spot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  notes: string;
  imageUrl?: string;
  type: string;
  order: number;
  placeId?: string;
}

interface Day {
  day: number;
  date?: string;
  spots: Spot[];
}

interface Itinerary {
  id: string;
  name: string;
  description: string;
  destination: string;
  totalDays: number;
  coverImage?: string;
  days: Day[];
  createdAt: string;
  updatedAt: string;
}

// ─── Default Tokyo Data ───────────────────────────────────────────────────────

const DEFAULT_ITINERARY: Itinerary = {
  id: "default-tokyo-2026",
  name: "東京深度探索",
  description: "從傳統寺廟到現代都市，感受東京的多元魅力",
  destination: "東京, 日本",
  totalDays: 3,
  coverImage:
    "https://images.unsplash.com/photo-1732667318116-18131c7e1442?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  days: [
    {
      day: 1,
      date: "2026-05-01",
      spots: [
        {
          id: "spot-senso-ji",
          name: "淺草寺",
          address: "東京都台東区浅草2-3-1",
          lat: 35.7148,
          lng: 139.7967,
          description:
            "東京最古老的佛教寺廟，建於628年。雷門的大燈籠是東京最具代表性的地標之一，仲見世商店街充滿各式傳統工藝品。",
          notes: "建議早上8點前到達，避開人潮。參觀後可在仲見世購買人形燒、雷おこし等傳統零食。",
          imageUrl:
            "https://images.unsplash.com/photo-1583400174684-98ef6b4d0d52?w=400",
          type: "attraction",
          order: 0,
        },
        {
          id: "spot-ueno",
          name: "上野公園",
          address: "東京都台東区上野公園5-20",
          lat: 35.7144,
          lng: 139.7742,
          description:
            "東京最大的公園之一，園內有東京國立博物館、上野動物園、西洋美術館等，春季賞櫻勝地。",
          notes: "推薦下午3點後前往，人潮較少。東京國立博物館每週二公休。",
          imageUrl:
            "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400",
          type: "attraction",
          order: 1,
        },
        {
          id: "spot-akihabara",
          name: "秋葉原電器街",
          address: "東京都千代田区外神田1丁目",
          lat: 35.7022,
          lng: 139.7741,
          description:
            "世界知名的電器、動漫、遊戲文化聚集地，從最新電子產品到二手遊戲、模型公仔應有盡有。",
          notes: "推薦BIC CAMERA和Yodobashi Camera比價購物，別錯過各樓層的主題扭蛋機台。",
          imageUrl:
            "https://images.unsplash.com/photo-1519998753584-56c5b49e6b50?w=400",
          type: "shopping",
          order: 2,
        },
      ],
    },
    {
      day: 2,
      date: "2026-05-02",
      spots: [
        {
          id: "spot-meiji",
          name: "明治神宮",
          address: "東京都渋谷区代々木神園町1-1",
          lat: 35.6765,
          lng: 139.6993,
          description:
            "建於1920，供奉明治天皇的神道神社，被近7萬棵人工林圍繞，是鬧市中的靜謐聖地。",
          notes: "清晨前往氣氛最佳，可看到神職人員的日常儀式。免費入場，內苑花費500円。",
          imageUrl:
            "https://images.unsplash.com/photo-1574236170878-c3b6c8c59c0f?w=400",
          type: "attraction",
          order: 0,
        },
        {
          id: "spot-harajuku",
          name: "原宿竹下通",
          address: "東京都渋谷区神宮前1丁目",
          lat: 35.6702,
          lng: 139.7027,
          description:
            "東京年輕人流行文化發源地，狹窄小街兩旁開滿個性服飾店、創意甜點店和各種潮流小物。",
          notes: "推薦下午前往，必吃Marion可麗餅。週末人潮極多，平日更舒適。",
          imageUrl:
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
          type: "shopping",
          order: 1,
        },
        {
          id: "spot-shibuya",
          name: "澀谷十字路口",
          address: "東京都渋谷区道玄坂1丁目",
          lat: 35.6595,
          lng: 139.7004,
          description:
            "號稱世界最繁忙的十字路口，每次綠燈同時有超過3000人穿越，是東京最壯觀的城市奇景。",
          notes: "傍晚霓虹燈亮起時最壯觀。可前往SHIBUYA SKY（地上229公尺）俯瞰全景，建議提前購票。",
          imageUrl:
            "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400",
          type: "attraction",
          order: 2,
        },
      ],
    },
    {
      day: 3,
      date: "2026-05-03",
      spots: [
        {
          id: "spot-tsukiji",
          name: "築地場外市場",
          address: "東京都中央区築地4丁目16-2",
          lat: 35.6655,
          lng: 139.7707,
          description:
            "東京最著名的海鮮市場周邊商圈，提供超新鮮的壽司、海鮮丼、玉子燒等日式美食，早起必訪。",
          notes: "早上5點開始營業，推薦大和壽司和岩手屋海鮮丼。市場週日及假日部分店休。",
          imageUrl:
            "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400",
          type: "restaurant",
          order: 0,
        },
        {
          id: "spot-tokyo-tower",
          name: "東京鐵塔",
          address: "東京都港区芝公園4-2-8",
          lat: 35.6586,
          lng: 139.7454,
          description:
            "高333公尺的紅白鐵塔，建於1958年，長年是東京最具代表性的地標，夜晚燈光璀璨。",
          notes: "夜間點燈分為白色燈光（平日）和橘色燈光（特定節日），入場費約1800円，建議黃昏入場欣賞日落。",
          imageUrl:
            "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400",
          type: "attraction",
          order: 1,
        },
        {
          id: "spot-odaiba",
          name: "台場",
          address: "東京都港区台場1丁目",
          lat: 35.6251,
          lng: 139.7756,
          description:
            "填海造陸的人工島，有大型購物中心、自由女神像複製品、彩虹橋夜景，是東京現代感十足的景點。",
          notes: "搭乘百合海鷗號（Yurikamome）前往，傍晚時彩虹橋燈光秀最美。推薦DiverCity Tokyo購物。",
          imageUrl:
            "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?w=400",
          type: "attraction",
          order: 2,
        },
      ],
    },
  ],
};

// ─── Real Tokyo Trip April 2026 ──────────────────────────────────────────────

const TOKYO_TRIP_APRIL_2026: Itinerary = {
  id: "tokyo-trip-april-2026",
  name: "東京行程 🇯🇵",
  description: "4/23–4/28 東京旅遊行程，上野・淺草・晴空塔・東京車站・涉谷",
  destination: "東京，日本",
  totalDays: 6,
  coverImage:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  createdAt: "2026-04-05T00:00:00.000Z",
  updatedAt: "2026-04-05T00:00:00.000Z",
  days: [
    // ── Day 1：4/23 出發・抵達東京 ──────────────────────────────────────────
    {
      day: 1,
      date: "2026-04-23",
      spots: [
        {
          id: "t1-taoyuan",
          name: "桃園國際機場",
          address: "桃園市大園區航翔路15號",
          lat: 25.0797,
          lng: 121.2342,
          type: "transport",
          description: "🛫 13:00 出發前往東京",
          notes: "8:00 還不確定從哪開始集合",
          order: 0,
        },
        {
          id: "t1-narita",
          name: "成田國際機場",
          address: "千葉県成田市古込1",
          lat: 35.7720,
          lng: 140.3929,
          type: "transport",
          description: "🛬 17:15 抵達東京",
          notes: "入境、領行李、前往上野",
          order: 1,
        },
        {
          id: "t1-apa-hotel",
          name: "APA HOTEL UENO-EKIKITA",
          address: "東京都台東区上野7-2-17",
          lat: 35.7140,
          lng: 139.7770,
          type: "hotel",
          description: "アパホテル〈上野駅北〉 — 住宿飯店",
          notes: "辦理 Check-in，放行李休息",
          order: 2,
        },
      ],
    },
    // ── Day 2：4/24 淺草・晴空塔・上野 ─────────────────────────────────────
    {
      day: 2,
      date: "2026-04-24",
      spots: [
        {
          id: "t2-doutor",
          name: "羅多倫咖啡 atre上野店",
          address: "東京都台東区上野7-1-1 アトレ上野",
          lat: 35.7139,
          lng: 139.7756,
          type: "restaurant",
          description: "☕ 早餐、咖啡。8:00 出門",
          notes: "atre 上野店，上野車站內",
          order: 0,
        },
        {
          id: "t2-sensoji",
          name: "淺草寺",
          address: "東京都台東区浅草2-3-1",
          lat: 35.7148,
          lng: 139.7967,
          type: "attraction",
          description: "⛩️ 東京最古老佛教寺廟，雷門・五重塔",
          notes: "都在淺草寺附近一帶",
          order: 1,
        },
        {
          id: "t2-jizo",
          name: "銭塚地蔵堂（Sensō-ji Jizo）",
          address: "東京都台東区浅草2-3-1",
          lat: 35.7154,
          lng: 139.7963,
          type: "attraction",
          description: "💰 金運守護・財運提升",
          notes: "求財運必訪",
          order: 2,
        },
        {
          id: "t2-inari",
          name: "被官稲荷神社",
          address: "東京都台東区浅草2-3-1",
          lat: 35.7153,
          lng: 139.7970,
          type: "attraction",
          description: "💰 招財・求職・金運",
          notes: "淺草寺境內",
          order: 3,
        },
        {
          id: "t2-nakamise",
          name: "仲見世通り（狸貓商店街）",
          address: "東京都台東区浅草1丁目",
          lat: 35.7138,
          lng: 139.7961,
          type: "shopping",
          description: "淺草寺參道商店街，人形燒、雷おこし、和風紀念品",
          notes: "",
          order: 4,
        },
        {
          id: "t2-skytree",
          name: "東京晴空塔",
          address: "東京都墨田区押上1-1-2",
          lat: 35.7101,
          lng: 139.8107,
          type: "attraction",
          description: "世界第二高塔（634m），俯瞰東京全景",
          notes: "",
          order: 5,
        },
        {
          id: "t2-harbs-ueno",
          name: "東京HARBS 水果千層（上野）",
          address: "東京都台東区上野3-23-6",
          lat: 35.7120,
          lng: 139.7757,
          type: "restaurant",
          description: "🍰 招牌水果千層蛋糕",
          notes: "如果東西很多先回飯店放東西",
          order: 6,
        },
        {
          id: "t2-yamashiroya",
          name: "玩具店 Yamashiroya ヤマシロヤ",
          address: "東京都台東区上野6-14-6",
          lat: 35.7078,
          lng: 139.7769,
          type: "shopping",
          description: "7層樓玩具專賣店，扭蛋、公仔、模型應有盡有",
          notes: "",
          order: 7,
        },
        {
          id: "t2-ameyoko",
          name: "阿美橫町（アメ横）",
          address: "東京都台東区上野4丁目",
          lat: 35.7097,
          lng: 139.7755,
          type: "shopping",
          description: "上野最熱鬧的露天市集街，生鮮、零食、服飾、雜貨",
          notes: "晚餐自理或一起吃",
          order: 8,
        },
        {
          id: "t2-unatoto",
          name: "名代 宇奈とと 上野店（鰻魚飯）",
          address: "東京都台東区上野6-11-1",
          lat: 35.7105,
          lng: 139.7764,
          type: "restaurant",
          description: "🐟 平價鰻魚飯專門店",
          notes: "晚餐選項",
          order: 9,
        },
        {
          id: "t2-negishi",
          name: "ねぎし 上野駅前店（牛舌）",
          address: "東京都台東区上野6-14-1",
          lat: 35.7108,
          lng: 139.7766,
          type: "restaurant",
          description: "🥩 仙台名物牛舌定食",
          notes: "晚餐選項",
          order: 10,
        },
        {
          id: "t2-nikki",
          name: "二木的菓子 BIC館",
          address: "東京都千代田区外神田4-3-3",
          lat: 35.7025,
          lng: 139.7742,
          type: "shopping",
          description: "🍬 超大間零食批發店，日本零食掃貨必訪",
          notes: "秋葉原附近，大間的那間",
          order: 11,
        },
      ],
    },
    // ── Day 3：4/25 自由活動 ─────────────────────────────────────────────────
    {
      day: 3,
      date: "2026-04-25",
      spots: [],
    },
    // ── Day 4：4/26 自由活動 ─────────────────────────────────────────────────
    {
      day: 4,
      date: "2026-04-26",
      spots: [],
    },
    // ── Day 5：4/27 東京車站・銀座・涉谷 ────────────────────────────────────
    {
      day: 5,
      date: "2026-04-27",
      spots: [
        {
          id: "t5-tokyo-station",
          name: "東京車站",
          address: "東京都千代田区丸の内1丁目",
          lat: 35.6812,
          lng: 139.7671,
          type: "attraction",
          description: "🚉 預計半天行程。東京駅丸の内紅磚站體、各種美食街",
          notes: "8:30 出發，結束後回飯店放東西。自理午餐。",
          order: 0,
        },
        {
          id: "t5-pudding-ginza",
          name: "PUDDING LAB Ginza",
          address: "東京都中央区銀座6丁目",
          lat: 35.6703,
          lng: 139.7634,
          type: "restaurant",
          description: "🍮 布丁冰淇淋甜點店，銀座話題名店",
          notes: "銀座順路",
          order: 1,
        },
        {
          id: "t5-shibuya",
          name: "涉谷",
          address: "東京都渋谷区道玄坂1丁目",
          lat: 35.6595,
          lng: 139.7004,
          type: "attraction",
          description: "🌆 澀谷十字路口、SHIBUYA SKY、購物商場，預計待到晚上",
          notes: "晚餐自理或一起吃",
          order: 2,
        },
        {
          id: "t5-mensai",
          name: "麵散（烏龍麵）",
          address: "東京都渋谷区",
          lat: 35.6583,
          lng: 139.7011,
          type: "restaurant",
          description: "🍜 涉谷人氣烏龍麵",
          notes: "餐廳選項",
          order: 3,
        },
        {
          id: "t5-harbs-shibuya",
          name: "東京HARBS 水果千層（涉谷）",
          address: "東京都渋谷区",
          lat: 35.6594,
          lng: 139.7017,
          type: "restaurant",
          description: "🍰 HARBS 水果千層蛋糕涉谷分店",
          notes: "",
          order: 4,
        },
      ],
    },
    // ── Day 6：4/28 返台 ─────────────────────────────────────────────────────
    {
      day: 6,
      date: "2026-04-28",
      spots: [
        {
          id: "t6-hotel-checkout",
          name: "APA HOTEL UENO-EKIKITA（退房）",
          address: "東京都台東区上野7-2-17",
          lat: 35.7140,
          lng: 139.7770,
          type: "hotel",
          description: "退房，自行起床吃早餐或機場再吃",
          notes: "10:20–10:30 集合出發前往機場",
          order: 0,
        },
        {
          id: "t6-airport",
          name: "成田國際機場（返台）",
          address: "千葉県成田市古込1",
          lat: 35.7720,
          lng: 140.3929,
          type: "transport",
          description: "🛫 15:45 返台 🛬 18:25 桃園落地",
          notes: "",
          order: 1,
        },
      ],
    },
  ],
};

// ─── KV Helpers ───────────────────────────────────────────────────────────────

const LIST_KEY = "travel:itineraries:list";
const itKey = (id: string) => `travel:itinerary:${id}`;

// ─── Auth Helpers ──────────────────────────────���──────────────────────────────

const AUTH_CREDENTIALS_KEY = "travel:auth:credentials";
const AUTH_SESSION_PREFIX = "travel:auth:session:";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function ensureDefaultCredentials() {
  const existing = await kv.get(AUTH_CREDENTIALS_KEY);
  if (!existing) {
    await kv.set(AUTH_CREDENTIALS_KEY, { username: "26", password: "26" });
    console.log("Seeded default credentials (username: 26, password: 26)");
  }
}

// ─── Member KV Helpers ────────────────────────────────────────────────────────

const MEMBERS_KEY = "travel:members:list";

interface Member {
  id: string;
  name: string;
  avatarColor: string;
  createdAt: string;
}

const DEFAULT_MEMBERS: Member[] = [
  { id: "member-1", name: "呂俊鈺", avatarColor: "#3B82F6", createdAt: new Date().toISOString() },
  { id: "member-2", name: "黃芳儀", avatarColor: "#F59E0B", createdAt: new Date().toISOString() },
  { id: "member-3", name: "曾偉晴", avatarColor: "#10B981", createdAt: new Date().toISOString() },
  { id: "member-4", name: "李苡瑄", avatarColor: "#EC4899", createdAt: new Date().toISOString() },
  { id: "member-5", name: "陳冠��", avatarColor: "#8B5CF6", createdAt: new Date().toISOString() },
];

async function getMembers(): Promise<Member[]> {
  return (await kv.get(MEMBERS_KEY)) || [];
}

async function saveMembers(members: Member[]) {
  await kv.set(MEMBERS_KEY, members);
}

async function ensureDefaultMembers() {
  const existing = await getMembers();
  if (existing.length === 0) {
    await saveMembers(DEFAULT_MEMBERS);
    console.log("Seeded default members");
  }
}

async function getList() {
  return (await kv.get(LIST_KEY)) || [];
}

async function saveList(list: any[]) {
  await kv.set(LIST_KEY, list);
}

async function getItinerary(id: string): Promise<Itinerary | null> {
  return await kv.get(itKey(id));
}

async function saveItinerary(it: Itinerary) {
  await kv.set(itKey(it.id), it);
  const list = await getList();
  const meta = {
    id: it.id,
    name: it.name,
    description: it.description,
    destination: it.destination,
    totalDays: it.totalDays,
    coverImage: it.coverImage,
    createdAt: it.createdAt,
  };
  const idx = list.findIndex((i: any) => i.id === it.id);
  if (idx >= 0) list[idx] = meta;
  else list.push(meta);
  await saveList(list);
}

/** Save a personal (member-specific) itinerary WITHOUT touching the global list */
async function savePersonalItinerary(it: Itinerary) {
  await kv.set(itKey(it.id), it);
}

async function ensureDefaults() {
  const list = await getList();
  // Verify each list entry actually has data; remove orphaned entries
  const validEntries: any[] = [];
  for (const meta of list) {
    const data = await kv.get(itKey(meta.id));
    if (data) {
      validEntries.push(meta);
    } else {
      console.log(`Removing orphaned list entry: ${meta.id}`);
    }
  }
  if (validEntries.length !== list.length) {
    await saveList(validEntries);
  }
  if (validEntries.length === 0) {
    await saveItinerary(DEFAULT_ITINERARY);
  }
  // Directly check KV (not just the list) to ensure the real trip data exists
  const realTripData = await kv.get(itKey(TOKYO_TRIP_APRIL_2026.id));
  if (!realTripData) {
    await saveItinerary(TOKYO_TRIP_APRIL_2026);
    console.log("Seeded Tokyo April 2026 trip into DB");
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/make-server-7f429b55/health", (c) => c.json({ status: "ok" }));

// ── Auth ──────────────────────────────────────────────────────────────────────

// Login
app.post("/make-server-7f429b55/auth/login", async (c) => {
  try {
    await ensureDefaultCredentials();
    const body = await c.req.json();
    const { username, password } = body;
    if (!username || !password) {
      return c.json({ error: "請輸入帳號和密碼" }, 400);
    }
    const credentials = await kv.get(AUTH_CREDENTIALS_KEY);
    if (credentials?.username !== username || credentials?.password !== password) {
      return c.json({ error: "帳號或密碼錯誤" }, 401);
    }
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + SESSION_TTL_MS;
    await kv.set(`${AUTH_SESSION_PREFIX}${token}`, { expiresAt, username });
    return c.json({ success: true, token, username });
  } catch (e) {
    console.log("Error login:", e);
    return c.json({ error: `登入失敗: ${e}` }, 500);
  }
});

// Verify session
app.post("/make-server-7f429b55/auth/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;
    if (!token) return c.json({ valid: false }, 401);
    const session = await kv.get(`${AUTH_SESSION_PREFIX}${token}`);
    if (!session || session.expiresAt < Date.now()) {
      return c.json({ valid: false }, 401);
    }
    // Refresh TTL
    await kv.set(`${AUTH_SESSION_PREFIX}${token}`, {
      ...session,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    return c.json({ valid: true, username: session.username });
  } catch (e) {
    console.log("Error verify:", e);
    return c.json({ valid: false }, 401);
  }
});

// Logout
app.post("/make-server-7f429b55/auth/logout", async (c) => {
  try {
    const body = await c.req.json();
    const { token } = body;
    if (token) await kv.del(`${AUTH_SESSION_PREFIX}${token}`);
    return c.json({ success: true });
  } catch (e) {
    console.log("Error logout:", e);
    return c.json({ success: false }, 500);
  }
});

// ── Members ────────────────────────────────────────────────────────────────────

// List members
app.get("/make-server-7f429b55/members", async (c) => {
  try {
    await ensureDefaultMembers();
    return c.json(await getMembers());
  } catch (e) {
    console.log("Error listing members:", e);
    return c.json({ error: `Failed to list members: ${e}` }, 500);
  }
});

// Create member
app.post("/make-server-7f429b55/members", async (c) => {
  try {
    const body = await c.req.json();
    const name = (body.name || "").trim();
    if (!name) return c.json({ error: "Name is required" }, 400);

    const COLORS = [
      "#3B82F6", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6",
      "#EF4444", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
    ];
    const members = await getMembers();
    const usedColors = new Set(members.map((m) => m.avatarColor));
    const availableColor = COLORS.find((c) => !usedColors.has(c)) ?? COLORS[members.length % COLORS.length];

    const newMember: Member = {
      id: `member-${Date.now()}`,
      name,
      avatarColor: availableColor,
      createdAt: new Date().toISOString(),
    };
    members.push(newMember);
    await saveMembers(members);
    return c.json(newMember, 201);
  } catch (e) {
    console.log("Error creating member:", e);
    return c.json({ error: `Failed to create member: ${e}` }, 500);
  }
});

// Delete member
app.delete("/make-server-7f429b55/members/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const members = await getMembers();
    const filtered = members.filter((m) => m.id !== id);
    if (filtered.length === members.length) {
      return c.json({ error: "Member not found" }, 404);
    }
    await saveMembers(filtered);
    return c.json({ success: true });
  } catch (e) {
    console.log("Error deleting member:", e);
    return c.json({ error: `Failed to delete member: ${e}` }, 500);
  }
});

// List itineraries
app.get("/make-server-7f429b55/itineraries", async (c) => {
  try {
    await ensureDefaults();
    return c.json(await getList());
  } catch (e) {
    console.log("Error listing itineraries:", e);
    return c.json({ error: `Failed to list itineraries: ${e}` }, 500);
  }
});

// Create itinerary
app.post("/make-server-7f429b55/itineraries", async (c) => {
  try {
    const body = await c.req.json();
    const now = new Date().toISOString();
    const id = `itinerary-${Date.now()}`;
    const totalDays = body.totalDays || 3;
    const it: Itinerary = {
      id,
      name: body.name || "新行程",
      description: body.description || "",
      destination: body.destination || "",
      totalDays,
      coverImage: body.coverImage,
      days: Array.from({ length: totalDays }, (_, i) => ({
        day: i + 1,
        date: body.startDate
          ? new Date(
              new Date(body.startDate).getTime() + i * 86400000
            )
              .toISOString()
              .split("T")[0]
          : undefined,
        spots: [],
      })),
      createdAt: now,
      updatedAt: now,
    };
    await saveItinerary(it);
    return c.json(it, 201);
  } catch (e) {
    console.log("Error creating itinerary:", e);
    return c.json({ error: `Failed to create itinerary: ${e}` }, 500);
  }
});

// Get itinerary
app.get("/make-server-7f429b55/itineraries/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // ── Personal (member-specific) itinerary ─────────────────────────────────
    if (id.startsWith("personal-")) {
      let it = await getItinerary(id);
      if (!it) {
        // Auto-create from the Tokyo template (deep copy)
        const template = (await getItinerary(TOKYO_TRIP_APRIL_2026.id)) ?? TOKYO_TRIP_APRIL_2026;
        const now = new Date().toISOString();
        const personalTrip: Itinerary = {
          ...JSON.parse(JSON.stringify(template)),
          id,
          updatedAt: now,
          createdAt: now,
        };
        // Rewrite spot IDs so they're unique per member
        const memberId = id.replace("personal-", "");
        personalTrip.days = personalTrip.days.map((d) => ({
          ...d,
          spots: d.spots.map((s) => ({
            ...s,
            id: `${s.id}-${memberId}`,
          })),
        }));
        await savePersonalItinerary(personalTrip);
        it = personalTrip;
        console.log(`[GET /:id] auto-created personal itinerary ${id}`);
      }
      return c.json(it);
    }

    // ── Shared itinerary ──────────────────────────────────────────────────────
    // 1st attempt
    let it = await getItinerary(id);

    if (!it) {
      // Seed defaults and try again
      console.log(`[GET /:id] ${id} not found – running ensureDefaults and retrying`);
      await ensureDefaults();
      it = await getItinerary(id);
    }

    if (it) return c.json(it);

    // Still not found: clean orphan from list, then return first valid itinerary as fallback
    console.log(`[GET /:id] ${id} still not found – cleaning orphan and returning fallback`);
    const list = await getList();
    const cleaned = list.filter((m: any) => m.id !== id);
    if (cleaned.length !== list.length) await saveList(cleaned);

    for (const meta of cleaned) {
      const fallback = await getItinerary(meta.id);
      if (fallback) {
        console.log(`[GET /:id] returning fallback ${meta.id}`);
        return c.json(fallback);
      }
    }

    // Absolute last resort: return in-memory default without KV dependency
    console.log(`[GET /:id] KV empty – returning in-memory DEFAULT_ITINERARY`);
    return c.json(DEFAULT_ITINERARY);
  } catch (e) {
    console.log("Error getting itinerary:", e);
    return c.json({ error: `Failed to get itinerary: ${e}` }, 500);
  }
});

// Update itinerary
app.put("/make-server-7f429b55/itineraries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await getItinerary(id);
    if (!existing) return c.json({ error: "Not found" }, 404);
    const body = await c.req.json();
    const updated: Itinerary = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    // Personal itineraries: save WITHOUT touching the global shared list
    if (id.startsWith("personal-")) {
      await savePersonalItinerary(updated);
    } else {
      await saveItinerary(updated);
    }
    return c.json(updated);
  } catch (e) {
    console.log("Error updating itinerary:", e);
    return c.json({ error: `Failed to update itinerary: ${e}` }, 500);
  }
});

// Delete itinerary
app.delete("/make-server-7f429b55/itineraries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(itKey(id));
    const list = await getList();
    await saveList(list.filter((i: any) => i.id !== id));
    return c.json({ success: true });
  } catch (e) {
    console.log("Error deleting itinerary:", e);
    return c.json({ error: `Failed to delete itinerary: ${e}` }, 500);
  }
});

// IG Import (simulated)
app.post("/make-server-7f429b55/ig-import", async (c) => {
  try {
    const { itineraryId, day, igUrl } = await c.req.json();
    if (!itineraryId || !day || !igUrl)
      return c.json({ error: "Missing required fields" }, 400);

    const it = await getItinerary(itineraryId);
    if (!it) return c.json({ error: "Itinerary not found" }, 404);

    const MOCK_PLACES = [
      {
        name: "東京鐵塔",
        address: "東京都港区芝公園4-2-8",
        lat: 35.6586,
        lng: 139.7454,
        description: "東京地標性建築，高333公尺，夜晚燈光璀璨",
      },
      {
        name: "淺草仲見世商店街",
        address: "東京都台東区浅草1-36",
        lat: 35.7132,
        lng: 139.796,
        description: "通往淺草寺的商店街，販售各式傳統工藝品",
      },
      {
        name: "新宿歌舞伎町",
        address: "東京都新宿区歌舞伎町1-1",
        lat: 35.6938,
        lng: 139.7034,
        description: "東京著名的娛樂區，霓虹燈璀璨，適合夜遊",
      },
      {
        name: "六本木之丘",
        address: "東京都港区六本木6-10-1",
        lat: 35.6604,
        lng: 139.7292,
        description: "集購物、藝術、展覽於一體的複合設施",
      },
      {
        name: "表參道",
        address: "東京都渋谷区神宮前4丁目",
        lat: 35.6652,
        lng: 139.7075,
        description: "東京最時尚的購物大道，匯聚國際知名品牌旗艦店",
      },
    ];

    const picked = MOCK_PLACES[Math.floor(Math.random() * MOCK_PLACES.length)];
    const dayIdx = it.days.findIndex((d) => d.day === day);
    if (dayIdx === -1) return c.json({ error: `Day ${day} not found` }, 404);

    const newSpot: Spot = {
      id: `ig-${Date.now()}`,
      ...picked,
      notes: `從 Instagram 匯入 | ${igUrl}`,
      imageUrl:
        "https://images.unsplash.com/photo-1649957866905-bef01af303da?w=400",
      type: "ig",
      order: it.days[dayIdx].spots.length,
    };

    it.days[dayIdx].spots.push(newSpot);
    it.updatedAt = new Date().toISOString();
    await saveItinerary(it);
    return c.json({ spot: newSpot, itinerary: it });
  } catch (e) {
    console.log("Error IG import:", e);
    return c.json({ error: `IG import failed: ${e}` }, 500);
  }
});

Deno.serve(app.fetch);