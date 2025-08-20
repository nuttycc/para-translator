import { createLogger, initLogger } from "../utils/logger";

export default defineBackground(() => {
	(async () => {
		await initLogger();
		const logger = createLogger("background");
		logger.debug("Hello background!");
	})();
});
