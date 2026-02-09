# Quickstart – Room booking price calculator (React + shadcn/ui)

This guide explains how to work on the room booking price calculator feature in this repository.

The application is a React single-page app built with Vite and TypeScript.
The calculator UI uses shadcn/ui components for a modern, consistent interface, and all user-facing text is in **Vietnamese**.

---

## 1. Running the app

From the repository root:

```bash
pnpm install
pnpm dev
```

Then open the local development URL shown in the terminal (typically `http://localhost:5173`).

---

## 2. Where the calculator lives

- Core feature directory:
  - `src/features/room-pricing/components/` – React + shadcn/ui components:
    - Room selector (dropdown from CSV)
    - Date pickers (Start/End) with **1-hour granularity**
    - “Tính tiền” (Calculate) button
    - Result panel showing “Tổng tiền” (total) and “Chi tiết giá” (required breakdown)
  - `src/features/room-pricing/hooks/` – hooks for:
    - Loading `src/assets/pricing.csv`
    - Managing state and validation
  - `src/features/room-pricing/lib/` – pure functions for:
    - Parsing CSV
    - Segmentation logic
    - Validation (must be on hour boundaries)
    - Calculation algorithm

---

## 3. How the price is calculated (tóm tắt bằng tiếng Việt)

Ở mức khái niệm, hệ thống tính giá theo các bước sau:

1. **Đọc bảng giá từ CSV**
   - Từ file `src/assets/pricing.csv`, hệ thống tạo danh sách phòng (`Room`) và các combo giá (`ComboPricing`).
   - Mỗi combo có giá cho ngày thường (T2–T5) và cuối tuần (T6–CN).

2. **Kiểm tra yêu cầu đặt phòng**
   - Người dùng chọn phòng, thời gian nhận phòng (start) và trả phòng (end).
   - **Lưu ý**: Chỉ chọn được theo giờ chẵn (ví dụ 10:00, 11:00), không chọn phút lẻ.
   - Hệ thống kiểm tra: end phải sau start, thời lượng không vượt quá 30 ngày.

3. **Chia khoảng thời gian theo từng ngày**
   - Khoảng thời gian đặt phòng được chia thành nhiều “đoạn trong ngày” (daily segments), mỗi đoạn ứng với một ngày trên lịch.
   - Với mỗi ngày, hệ thống xác định đây là **ngày thường** hay **cuối tuần**.

4. **Áp dụng combo theo ưu tiên**
   - Trong từng ngày, hệ thống ưu tiên dùng các **combo**:
     - Combo 3 giờ (`Nghỉ theo giờ`)
     - Combo nửa ngày (10:00–19:00 hoặc 22:00–09:00)
     - Combo 1 ngày (14:00–12:00 ngày hôm sau)
   - Nếu thời lượng đặt phòng trong ngày **ngắn hơn 3 giờ**, hệ thống vẫn tính **trọn giá combo 3 giờ**.

5. **Tính giờ phụ trội (nếu cần)**
   - Nếu các combo không bao phủ hết, phần dư được tính giá cố định:
     - Ngày thường (T2–T5): **70.000 VND/giờ**
     - Cuối tuần (T6–CN): **80.000 VND/giờ**
   - Giờ phụ trội được làm tròn lên (nhưng do đầu vào chẵn giờ nên thường là số nguyên).

6. **Tìm tổ hợp rẻ nhất**
   - Đối với mỗi ngày, hệ thống thử nhiều cách kết hợp giữa các combo và số giờ phụ trội, chọn **tổ hợp có tổng tiền thấp nhất**.

7. **Trả về tổng tiền và giải thích chi tiết**
   - Hệ thống trả về:
     - **Tổng tiền (VND)**.
     - **Chi tiết giá**: Bắt buộc hiển thị danh sách các phần giá (combo + giờ) để khách hàng hiểu rõ.

---

## 4. Testing approach

- Viết test **trước khi triển khai** (TDD):
  - Unit tests cho các hàm tính toán (`lib/`).
  - Integration tests cho luồng API giả lập.
  - Component tests cho UI (kiểm tra hiển thị tiếng Việt, input 1 giờ).
- Stack: Vitest + React Testing Library.

---

## 5. Tiếp theo

- Khi cài đặt, bám sát các mô hình dữ liệu trong `data-model.md` và hợp đồng trong `contracts/price-calculation.openapi.yaml`.
- Đảm bảo mọi thông báo lỗi và nhãn input đều bằng tiếng Việt.
