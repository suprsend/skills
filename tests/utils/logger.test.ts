import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, setLogLevel } from "../../src/utils/logger.js";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setLogLevel("info");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("at default (info) level", () => {
    it("suppresses debug messages", () => {
      logger.debug("hidden");
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("shows info messages", () => {
      logger.info("visible");
      expect(logSpy).toHaveBeenCalledWith("[INFO]", "visible");
    });

    it("shows warn messages via console.warn", () => {
      logger.warn("warning");
      expect(warnSpy).toHaveBeenCalledWith("[WARN]", "warning");
    });

    it("shows error messages via console.error", () => {
      logger.error("failure");
      expect(errorSpy).toHaveBeenCalledWith("[ERROR]", "failure");
    });
  });

  describe("at debug level", () => {
    beforeEach(() => setLogLevel("debug"));

    it("shows debug messages", () => {
      logger.debug("debug msg");
      expect(logSpy).toHaveBeenCalledWith("[DEBUG]", "debug msg");
    });

    it("shows info messages", () => {
      logger.info("info msg");
      expect(logSpy).toHaveBeenCalledWith("[INFO]", "info msg");
    });
  });

  describe("at error level", () => {
    beforeEach(() => setLogLevel("error"));

    it("suppresses debug messages", () => {
      logger.debug("hidden");
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("suppresses info messages", () => {
      logger.info("hidden");
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("suppresses warn messages", () => {
      logger.warn("hidden");
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("shows error messages", () => {
      logger.error("critical");
      expect(errorSpy).toHaveBeenCalledWith("[ERROR]", "critical");
    });
  });

  describe("at warn level", () => {
    beforeEach(() => setLogLevel("warn"));

    it("suppresses info messages", () => {
      logger.info("hidden");
      expect(logSpy).not.toHaveBeenCalled();
    });

    it("shows warn messages", () => {
      logger.warn("visible");
      expect(warnSpy).toHaveBeenCalledWith("[WARN]", "visible");
    });

    it("shows error messages", () => {
      logger.error("visible");
      expect(errorSpy).toHaveBeenCalledWith("[ERROR]", "visible");
    });
  });

  it("accepts multiple arguments", () => {
    logger.info("msg", { data: 1 }, 42);
    expect(logSpy).toHaveBeenCalledWith("[INFO]", "msg", { data: 1 }, 42);
  });
});
