#
# Copyright (C) 2008-2014 The LuCI Team <luci@lists.subsignal.org>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

$(if $(wildcard $(CURDIR)/htdocs/luci-static/material3/cascade.css),,\
  $(error Missing htdocs/luci-static/material3/cascade.css. Make sure to run 'bun build:css' in the package directory before building the package.))

LUCI_TITLE:=Material 3 Theme
LUCI_DESCRIPTION:=Material Design 3 theme for OpenWrt LuCI
LUCI_DEPENDS:=+luci-base
LUCI_MINIFY_CSS:=0
PKG_VERSION:=0.1
PKG_RELEASE:=20260701

PKG_LICENSE:=Apache-2.0

define Package/luci-theme-material3/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.Material3
	uci commit luci
}
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
