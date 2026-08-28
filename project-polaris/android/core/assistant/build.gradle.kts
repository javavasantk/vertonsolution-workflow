plugins {
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.projectpolaris.assistant"
    compileSdk = 35

    defaultConfig {
        minSdk = 26
    }
}

dependencies {
    implementation(libs.kotlinx.coroutines.core)
    testImplementation(kotlin("test"))
}
