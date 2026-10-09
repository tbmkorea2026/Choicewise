---
title: "SunFounder Pironman 5 vs Pironman 5-MAX: Which Raspberry Pi 5 Case?"
shortTitle: "Pironman 5 vs 5-MAX"
seoTitle: "Pironman 5 vs Pironman 5-MAX ({{year}}): NVMe Slots, RAID, Cooling & Price Compared"
description: "SunFounder's two best sellers compared. The Pironman 5 ($79.99) has one NVMe slot in a silver case; the Pironman 5-MAX ($94.99) has two NVMe slots with RAID 0/1 in a dark case. Here's which Raspberry Pi 5 case to buy."
category: tech
author: editorial-team
date: 2026-10-09
updated: 2026-10-09
intro: |
  The **Pironman 5** and **Pironman 5-MAX** are SunFounder's two best-selling products, and both turn a **Raspberry Pi 5** into a mini PC with a tower cooler, RGB fans, a 0.96" OLED, full-size HDMI and a safe-shutdown power button. The big difference is storage: the **Pironman 5** has **one NVMe slot**, while the **5-MAX** has **two**, with **RAID 0/1** support. Here's how to choose.
products:
  - name: "SunFounder Pironman 5"
    badge: "Best Value"
    price: "From $79.99"
    merchant: "SunFounder"
    link: "https://www.sunfounder.com/products/pironman-5-nvme-m-2-ssd-pcie-mini-pc-case-for-raspberry-pi-5?ref=win88"
    linkId: sunfounder-pironman-5
    image: "/assets/img/products/sunfounder-pironman-5.webp"
    bestFor: "One SSD: desktop, Home Assistant or media center"
    summary: "Silver aluminum case with one NVMe M.2 slot (PCIe Gen 2, can be forced to Gen 3), tower cooler, two RGB fans and a 0.96\" OLED. Rated 4.8/5 from 163 store reviews."
    pros: ["$15 cheaper", "Direct single-SSD link", "Silver finish"]
    cons: ["One M.2 slot only", "No RAID"]
    specs:
      NVMe slots: "1"
      Finish: "Silver aluminum"
      Price: "$79.99"
      Rating: "4.8/5 (163)"
  - name: "SunFounder Pironman 5-MAX"
    badge: "Best for NAS & AI"
    price: "From $94.99"
    merchant: "SunFounder"
    link: "https://www.sunfounder.com/products/pironman-5-max?ref=win88"
    linkId: sunfounder-pironman-5-max
    image: "/assets/img/products/sunfounder-pironman-5-max.webp"
    bestFor: "Two SSDs, RAID 0/1 or SSD + Hailo-8L"
    summary: "Dark case with two NVMe M.2 slots behind a PCIe Gen 2 switch, RAID 0/1 support and an OLED that lists disk status and wakes with a tap. Rated 4.9/5 from 200 store reviews."
    pros: ["Two NVMe slots", "RAID 0/1", "SSD and AI accelerator together"]
    cons: ["$15 more", "Slots share one Gen 2 link"]
    specs:
      NVMe slots: "2"
      Finish: "Dark aluminum"
      Price: "$94.99"
      Rating: "4.9/5 (200)"
faqs:
  - q: "What's the difference between the Pironman 5 and Pironman 5-MAX?"
    a: "The Pironman 5 has one NVMe M.2 slot in a silver aluminum case for $79.99. The Pironman 5-MAX has two NVMe slots behind a PCIe Gen 2 switch with RAID 0/1 support, in a dark case, for $94.99. Cooling, OLED, HDMI and the power button are otherwise similar."
  - q: "Is the Pironman 5-MAX faster?"
    a: "Not for a single SSD. Both run the Raspberry Pi 5's one PCIe lane; the 5-MAX shares it between two slots through a Gen 2 switch. SunFounder says the Pironman 5's single slot is certified for Gen 2 and can be forced to Gen 3. The 5-MAX's advantage is capacity and flexibility, not raw speed."
  - q: "Can I use a Hailo-8L AI accelerator and an SSD together?"
    a: "On the Pironman 5-MAX, yes: one slot for the SSD and one for the accelerator. On the Pironman 5, the single slot takes one or the other."
  - q: "Do both need the same extras?"
    a: "Yes: a Raspberry Pi 5, a 27W USB-C power supply, a micro SD card and NVMe SSDs. Both can be bought with a US, EU or UK power supply bundled."
---

## Quick verdict

- **Choose the Pironman 5** if you'll use **one SSD** (or one Hailo-8L), want to save **$15**, or prefer the **silver** look.
- **Choose the Pironman 5-MAX** if you want **two SSDs**, a **RAID 0/1** home NAS, or an **SSD plus an AI accelerator**, or prefer the **dark** finish.

## Side-by-side comparison

| | **Pironman 5** | **Pironman 5-MAX** |
| --- | --- | --- |
| Compatible board | Raspberry Pi 5 | Raspberry Pi 5 |
| NVMe M.2 slots | 1 (2230–2280) | 2 (2230–2280) |
| PCIe | Gen 2.0 certified, can be forced to Gen 3.0 | Gen 2 switch shared by both slots |
| RAID | No | RAID 0/1 |
| AI accelerator | Hailo-8L (uses the slot) | Hailo-8L alongside an SSD |
| Cooling | Tower cooler (PWM fan) + 2× 40 mm RGB fans | Tower cooler (PWM fan) + 2× 40 mm RGB fans |
| OLED | 0.96" (CPU, RAM, temp, IP and more) | 0.96" (CPU, RAM, temp, IP, disk; tap-to-wake) |
| HDMI | 2× standard | 2× standard |
| Finish | Silver aluminum, clear panels | Dark aluminum, dark panels |
| RTC battery | Included | Included |
| Price (case only) | $79.99 | $94.99 |
| With US/EU power supply | $92.99 | $107.98 |
| Rating on store | 4.8/5 (163) | 4.9/5 (200) |

Both ship free from SunFounder's China warehouse, and **neither includes the Raspberry Pi 5, SSDs or a power supply** unless you pick a power-supply bundle.

## Storage: one slot or two?

The Raspberry Pi 5 has **one PCIe lane**. The Pironman 5 connects a single SSD straight to it; SunFounder says it's **certified for Gen 2 (5 GT/s)** and can be **forced to Gen 3 (10 GT/s)**. The 5-MAX adds a **PCIe Gen 2 switch** so **two** devices can share that lane. That makes it the one to pick for **RAID 1 mirroring** (a copy of your data on each drive), **RAID 0** (two drives as one bigger volume), or an **SSD plus a Hailo-8L**. If you only ever need one drive, the extra slot doesn't make it faster.

> **SSD compatibility applies to both.** SunFounder lists drives to avoid, mostly with **Phison controllers** (for example WD Green SN350, WD Black SN770/SN850, Corsair MP600, Samsung PM991). Check the list before you buy an SSD.

## Cooling and extras

Both use a **tower cooler with a PWM fan** on the CPU plus **two 40 mm RGB fans**, a **metal power button with safe shutdown**, an **IR receiver**, an **external GPIO extender** and a **1220 RTC battery**. The 5-MAX's OLED lists **disk status** among its readouts and can wake with a light tap (newer software uses the power button instead, per SunFounder's FAQ).

## The bottom line

For most Raspberry Pi 5 desktops, media centers and Home Assistant hubs, the **Pironman 5** does the job for less. If you're building a **two-drive NAS** or want an **SSD and an AI accelerator** at the same time, the **Pironman 5-MAX** is worth the extra $15. Read the full [Pironman 5 review](/reviews/sunfounder-pironman-5-review/), our [best SunFounder products](/best/best-sunfounder-products/) and our [SunFounder review](/reviews/sunfounder-review/).
