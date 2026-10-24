import { useId, type ReactNode } from 'react';
import { Logo } from '../ui/components/Logo';
import { ThemeToggle } from '../ui/components/ThemeToggle';

const REPO = 'https://github.com/ninhhaidang/shopeestatx';

const PERMISSIONS = [
  ['activeTab', 'Đọc URL tab hiện tại để kiểm tra người dùng đang ở shopee.vn trước khi bắt đầu'],
  ['storage', 'Lưu cache lịch sử đơn hàng trên máy người dùng để tránh phải tải lại mỗi lần mở extension'],
  [
    'scripting',
    'Inject script vào tab Shopee để gọi API Shopee với cookie trình duyệt — đây là cách duy nhất để lấy dữ liệu mà không cần tài khoản riêng hay server trung gian',
  ],
  ['https://shopee.vn/*', 'Giới hạn host permission — extension chỉ có thể inject script vào shopee.vn, không có quyền trên bất kỳ trang web nào khác'],
] as const;

const linkClass = 'text-accent-text underline underline-offset-4 hover:text-accent-hover';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-xl border border-line bg-card p-4 sm:p-6">
      <h2 id={id} className="mb-3 font-serif text-lg font-semibold">
        {title}
      </h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-muted [&_strong]:text-fg">{children}</div>
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ml-5 list-disc">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

const code = (text: string) => <code className="rounded bg-bg px-1 font-mono text-[0.9em] text-fg">{text}</code>;

/** Privacy policy. Wording is legal text: keep it identical to the published policy. */
export function Privacy() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <header className="mb-4 flex flex-col items-center gap-1 border-b border-line pb-6 text-center">
          <Logo className="text-lg" />
          <h1 className="font-serif text-3xl font-semibold">Chính sách bảo mật</h1>
          <p className="text-sm text-muted">ShopeeStatX &nbsp;•&nbsp; Cập nhật lần cuối: 05/03/2026</p>
          <p className="text-sm text-muted">
            <em>Privacy Policy / Politique de confidentialité</em>
          </p>
        </header>

        <main className="flex flex-col gap-4">
          <Section title="1. Tổng quan (Overview)">
            <p>
              ShopeeStatX là Chrome Extension giúp người dùng phân tích lịch sử chi tiêu trên Shopee. Extension hoạt động hoàn toàn cục bộ — không có
              server, không có cơ sở dữ liệu bên ngoài, không thu thập hay truyền dữ liệu cá nhân ra bên ngoài.
            </p>
            <p>
              <em>
                ShopeeStatX is a Chrome Extension that helps users analyze their Shopee spending history. The extension runs entirely locally — no
                server, no external database, no collection or transmission of personal data.
              </em>
            </p>
          </Section>

          <Section title="2. Dữ liệu được truy cập (Data Accessed)">
            <p>Extension chỉ truy cập dữ liệu khi người dùng chủ động nhấn "Bắt đầu phân tích":</p>
            <List
              items={[
                'Lịch sử đơn hàng Shopee (qua API Shopee, sử dụng session trình duyệt)',
                'Thông tin đơn hàng: mã đơn, tên sản phẩm, ngày giao, trạng thái, tổng tiền, tên shop',
              ]}
            />
            <p>
              Dữ liệu này <strong>chỉ được lưu trên máy người dùng</strong> trong {code('chrome.storage.local')} và{' '}
              <strong>không bao giờ được gửi đến server hay bên thứ ba nào</strong>.
            </p>
          </Section>

          <Section title="3. Quyền truy cập và lý do (Permissions)">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="border border-line bg-bg p-2.5 font-semibold text-fg">Quyền</th>
                    <th className="border border-line bg-bg p-2.5 font-semibold text-fg">Lý do sử dụng</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map(([name, reason]) => (
                    <tr key={name}>
                      <td className="border border-line p-2.5 align-top font-mono font-semibold break-all text-accent-text sm:whitespace-nowrap">{name}</td>
                      <td className="border border-line p-2.5 align-top">{reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="4. Dữ liệu không được chia sẻ (No Data Sharing)">
            <p>
              ShopeeStatX <strong>không</strong>:
            </p>
            <List
              items={[
                'Gửi dữ liệu đến server nào',
                'Sử dụng analytics hay tracking',
                'Thu thập thông tin cá nhân',
                'Tạo tài khoản người dùng',
                'Chia sẻ dữ liệu với bên thứ ba',
              ]}
            />
            <div className="mt-2 rounded-lg border border-good bg-bg p-3 text-good">
              Toàn bộ dữ liệu đơn hàng chỉ tồn tại trên máy của bạn và bị xóa hoàn toàn khi bạn gỡ cài đặt extension.
            </div>
          </Section>

          <Section title="5. Lưu trữ dữ liệu (Data Storage)">
            <p>
              Dữ liệu được lưu tại {code('chrome.storage.local')} — bộ nhớ cục bộ của Chrome, chỉ truy cập được từ extension này, không đồng bộ lên
              cloud. Xóa khi:
            </p>
            <List
              items={[
                'Gỡ cài đặt extension',
                <>Xóa dữ liệu Chrome tại {code('chrome://settings/clearBrowserData')}</>,
                'Nhấn "Làm mới dữ liệu" trong extension (xóa cache cũ, tải lại)',
              ]}
            />
          </Section>

          <Section title="6. Tuyên bố miễn trừ (Disclaimer)">
            <p>
              ShopeeStatX là dự án mã nguồn mở độc lập, <strong>không liên kết chính thức với Shopee</strong>. Extension sử dụng API Shopee theo cách
              tương tự trình duyệt web bình thường (dùng session đăng nhập sẵn có).
            </p>
          </Section>

          <Section title="7. Liên hệ (Contact)">
            <p>Nếu có câu hỏi về chính sách bảo mật:</p>
            <List
              items={[
                <>
                  GitHub Issues:{' '}
                  <a className={linkClass} href={`${REPO}/issues`} target="_blank" rel="noopener noreferrer">
                    github.com/ninhhaidang/shopeestatx/issues
                  </a>
                </>,
                <>
                  GitHub:{' '}
                  <a className={linkClass} href="https://github.com/ninhhaidang" target="_blank" rel="noopener noreferrer">
                    github.com/ninhhaidang
                  </a>
                </>,
              ]}
            />
          </Section>
        </main>

        <footer className="mt-4 text-center text-sm text-muted">
          ShopeeStatX &nbsp;•&nbsp; MIT License &nbsp;•&nbsp;{' '}
          <a className={linkClass} href={REPO} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
