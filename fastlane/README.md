fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios fix_privacy

```sh
[bundle exec] fastlane ios fix_privacy
```

앱 개인정보 추적 설정 수정 (추적 없음으로 변경)

### ios create_app

```sh
[bundle exec] fastlane ios create_app
```

App Store Connect에 앱 등록 (최초 1회)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

TestFlight 업로드 (심사 제출 없음)

### ios upload_screenshots

```sh
[bundle exec] fastlane ios upload_screenshots
```

스크린샷만 업로드

### ios prepare_release

```sh
[bundle exec] fastlane ios prepare_release
```

App Store 메타데이터 + 바이너리 업로드 (심사 제출 없음)

----


## Android

### android prepare_release

```sh
[bundle exec] fastlane android prepare_release
```

Play Store AAB 업로드 (내부 트랙 Draft)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
