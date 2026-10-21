import { Faker, base, en, vi, type LocaleDefinition } from "@faker-js/faker";

import { requestStatuses, type Request } from "./contract/request";

const locales: Record<string, LocaleDefinition[]> = {
  en: [en, base],
  vi: [vi, en, base],
};

export interface SeedOptions {
  /** Faker locale: "vi", "en" (falls back to en). */
  locale?: string;
  /** Number of generated rows (stress fixtures are added on top). */
  count?: number;
  /** Fixed seed: same seed + locale + count => identical data. */
  seed?: number;
  /** Reference date for generated timestamps (keeps output deterministic). */
  refDate?: string;
  /** Include edge-case rows (long titles, missing optionals, many tags). */
  stress?: boolean;
}

export function createFaker(locale = "en", seed = 42): Faker {
  const faker = new Faker({ locale: locales[locale] ?? locales.en });
  faker.seed(seed);
  return faker;
}

/** Owners used by the seed; screens can offer them in a Combobox. */
export function seedOwners(locale = "en", seed = 42, count = 12): string[] {
  const faker = createFaker(locale, seed + 1);
  return Array.from({ length: count }, () => faker.person.fullName());
}

export function seedRequests(options: SeedOptions = {}): Request[] {
  const {
    locale = "en",
    count = 240,
    seed = 42,
    refDate = "2026-06-30T00:00:00.000Z",
    stress = true,
  } = options;
  const faker = createFaker(locale, seed);
  const owners = seedOwners(locale, seed);
  const tagPool = ["urgent", "finance", "it", "hr", "legal", "travel", "q1", "q2", "q3", "q4"];

  const rows: Request[] = Array.from({ length: count }, (_, i) => {
    const hasDescription = faker.datatype.boolean({ probability: 0.7 });
    return {
      id: `REQ-${String(i + 1).padStart(5, "0")}`,
      title: faker.lorem.sentence({ min: 3, max: 8 }).replace(/\.$/, ""),
      status: faker.helpers.arrayElement(requestStatuses),
      owner: faker.helpers.arrayElement(owners),
      createdAt: faker.date.past({ years: 1, refDate }).toISOString(),
      amount: faker.number.int({ min: 0, max: 500_000 }) * 1000,
      ...(hasDescription ? { description: faker.lorem.paragraph() } : {}),
      tags: faker.helpers.arrayElements(tagPool, { min: 0, max: 3 }),
    };
  });

  if (stress) rows.unshift(...stressFixtures(refDate, owners));
  return rows;
}

/** Edge cases every list/detail screen must survive. */
export function stressFixtures(refDate: string, owners: string[]): Request[] {
  const owner = owners[0] ?? "Owner";
  return [
    {
      id: "REQ-LONG",
      title:
        "Đề nghị phê duyệt ngân sách mua sắm trang thiết bị văn phòng cho toàn bộ các chi nhánh khu vực phía Nam trong năm tài chính tới, bao gồm máy tính xách tay, màn hình, bàn ghế công thái học và các phụ kiện đi kèm theo danh mục đính kèm",
      status: "submitted",
      owner: "Nguyễn Thị Phương Thảo Hoàng Bảo Ngọc",
      createdAt: refDate,
      amount: 987_654_321_000,
      description: "x".repeat(2000),
      tags: [],
    },
    {
      id: "REQ-MIN",
      title: "Đề nghị",
      status: "draft",
      owner,
      createdAt: refDate,
      amount: 0,
      tags: [],
    },
    {
      id: "REQ-TAGS",
      title: "Request with many tags",
      status: "approved",
      owner,
      createdAt: refDate,
      amount: 1000,
      description: "",
      tags: Array.from({ length: 30 }, (_, i) => `tag-${i + 1}`),
    },
  ];
}
