import { remote } from "webdriverio";

export async function openSession(settings) {
    return remote({
        capabilities: {
            platformName: "Android",
            "appium:platformVersion": "11",
            "appium:deviceName": "Android",
            "appium:automationName": "uiautomator2",
            "appium:appPackage": "com.bcadigital.blu",
            "appium:appActivity": "com.bcadigital.blu.ui.start.BluStartActivity",
            "appium:udid": settings.device.code,
            "appium:noReset": true,
        },
        hostname: "127.0.0.1",
        port: settings.device.port_appium,
        logLevel: "silent",
    });
}

export async function closeSession(driver) {
    if (driver) {
        await driver.deleteSession();
    }
}
