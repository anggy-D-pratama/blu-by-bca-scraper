import { remote } from "webdriverio";

export async function openSession(settings, bankAdapter) {
    return remote({
        capabilities: {
            platformName: "Android",
            "appium:platformVersion": "11",
            "appium:deviceName": "Android",
            "appium:automationName": "uiautomator2",
            "appium:appPackage": bankAdapter?.appPackage ?? settings?.device?.appPackage,
            "appium:appActivity": bankAdapter?.appActivity ?? settings?.device?.appActivity,
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
