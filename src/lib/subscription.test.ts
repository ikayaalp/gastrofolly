import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock'lama işlemleri importlardan ÖNCE gelmeli
const updateMock = vi.fn();
vi.mock("./prisma", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}));

import { isPremiumUser, lazyCleanupExpiredSubscription } from "./subscription";
import { prisma } from "./prisma";

describe("isPremiumUser", () => {
  it("user null ise false döner", () => {
    expect(isPremiumUser(null)).toBe(false);
    expect(isPremiumUser(undefined)).toBe(false);
  });

  it("subscriptionPlan 'Premium' değilse false döner", () => {
    const user = { subscriptionPlan: "Free", subscriptionEndDate: new Date(Date.now() + 10000) };
    expect(isPremiumUser(user)).toBe(false);
  });

  it("subscriptionPlan 'Premium' ancak tarih null ise true döner (geçiş süreci/edge case)", () => {
    const user = { subscriptionPlan: "Premium", subscriptionEndDate: null };
    expect(isPremiumUser(user)).toBe(true);
  });

  it("geçerli (gelecek) subscriptionEndDate varsa true döner", () => {
    const futureDate = new Date(Date.now() + 100000);
    const user = { subscriptionPlan: "Premium", subscriptionEndDate: futureDate };
    expect(isPremiumUser(user)).toBe(true);
  });

  it("geçmiş tarihli subscriptionEndDate varsa false döner", () => {
    const pastDate = new Date(Date.now() - 100000);
    const user = { subscriptionPlan: "Premium", subscriptionEndDate: pastDate };
    expect(isPremiumUser(user)).toBe(false);
  });
});

describe("lazyCleanupExpiredSubscription", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T00:00:00Z"));
    updateMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("süresi dolmuş Premium kullanıcının abonelik bilgilerini temizler", async () => {
    const pastDate = new Date("2026-07-12T00:00:00Z");
    const user = {
      id: "user123",
      subscriptionPlan: "Premium",
      subscriptionEndDate: pastDate,
      subscriptionStartDate: new Date("2026-06-12T00:00:00Z"),
      subscriptionBillingPeriod: "monthly",
      subscriptionReferenceCode: "ref123"
    };

    await lazyCleanupExpiredSubscription(prisma, user);

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: {
        subscriptionPlan: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        subscriptionBillingPeriod: null,
        subscriptionReferenceCode: null,
        subscriptionCancelled: false
      }
    });

    // Obje referansı üzerinden yerel olarak da sıfırlanıp sıfırlanmadığını kontrol ediyoruz
    expect(user.subscriptionPlan).toBeNull();
    expect(user.subscriptionEndDate).toBeNull();
  });

  it("süresi dolmamış Premium kullanıcı için hiçbir işlem yapmaz", async () => {
    const futureDate = new Date("2026-07-14T00:00:00Z");
    const user = {
      id: "user123",
      subscriptionPlan: "Premium",
      subscriptionEndDate: futureDate
    };

    await lazyCleanupExpiredSubscription(prisma, user);

    expect(updateMock).not.toHaveBeenCalled();
    expect(user.subscriptionPlan).toBe("Premium");
  });

  it("zaten Premium olmayan kullanıcı için hiçbir işlem yapmaz", async () => {
    const pastDate = new Date("2026-07-12T00:00:00Z");
    const user = {
      id: "user123",
      subscriptionPlan: null,
      subscriptionEndDate: pastDate
    };

    await lazyCleanupExpiredSubscription(prisma, user);

    expect(updateMock).not.toHaveBeenCalled();
  });
});
