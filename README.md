# luci-theme-material3

Material 3 theme for OpenWrt LuCI. This theme is based on the original [luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap), [MDUI](https://github.com/zdhxiong/mdui/), and the [Google Material 3](https://m3.material.io/) design guidelines. It aims to replace the Bootstrap-based design (because I don't really like it, heh) while staying as close to the original LuCI ([luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap)) experience as possible.

## Screenshots

| <img width="2880" height="5542" alt="overview" src="https://github.com/user-attachments/assets/c49df87f-7d4b-4359-bee8-332f76182e6f" /> | <img width="2880" height="2590" alt="luci-dashboard" src="https://github.com/user-attachments/assets/85706d5d-e3d7-4408-a32e-194d887ded9e" /> |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| <img width="2880" height="2670" alt="dialog" src="https://github.com/user-attachments/assets/b6e77f6a-9c0e-4d3c-8cc6-6f792de133b5" />   | <img width="2880" height="1890" alt="interface" src="https://github.com/user-attachments/assets/31380cc0-c08b-4c5a-b6a3-05ee8e66798b" />      |
| <img width="1900" height="970" alt="login" src="https://github.com/user-attachments/assets/bbbeffef-050c-4605-9465-f52fe3335351" />     | <img width="2880" height="3088" alt="systemlog" src="https://github.com/user-attachments/assets/41a72a7d-f8da-42fc-9309-bfa23e262e10" />      |

## Installation

- Download the latest release from the [releases page](https://github.com/michioxd/luci-theme-material3/releases).
- If you are using `apk`, you need to use the `--allow-untrusted` option to install the package, as it is not signed by a trusted key. For example:

    ```bash
    apk add --allow-untrusted luci-theme-material3_0.1-1_all.ipk
    ```

- Then go to the LuCI web interface, navigate to `System` > `System` > `Language and Style`, and select `Material3` as the theme.

## License

[Apache 2.0](./LICENSE)
