import { useId, type ReactNode } from 'react';
import { Logo } from '../ui/components/Logo';
import { ThemeToggle } from '../ui/components/ThemeToggle';
import { card, chip } from '../ui/styles/classes';

const REPO = 'https://github.com/ninhhaidang/shopeestatx';

const PERMISSIONS = [
  ['activeTab', 'Đọc URL tab hiện tại để kiểm tra người dùng đang ở shopee.vn trước khi bắt đầu'],
  ['storage', 'Lưu cache lịch sử đơn hàng trên máy người dùng để tránh phải tải lại mỗi lần mở extension'],
  [
    'scripting',
    'Inject script vào tab Shopee để gọi API Shopee với cookie trình duyệt — đây là cách duy nhất để lấy dữ liệu mà không cần tài khoản riêng hay server trung gian',
  ],
  ['sidePanel', 'Mở dashboard trong bảng bên của Chrome, cạnh trang Shopee'],
  ['https://shopee.vn/*', 'Giới hạn host permission — extension chỉ có thể inject script vào shopee.vn, không có quyền trên bất kỳ trang web nào khác'],
] as const;

const linkClass = 'text-accent-text underline underline-offset-4 hover:text-accent-hover';

/** A numbered policy section; the heading still reads "1. Tổng quan (Overview)" as one string. */
function Section({ n, title, en, children }: { n: number; title: string; en: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`${card} grid gap-x-4 sm:grid-cols-[2rem_minmax(0,1fr)]`}>
      <span aria-hidden="true" className="num text-lg font-semibold leading-7 text-accent-text">
        {n}
      </span>
      <div className="min-w-0">
        <h2 id={id} className="mb-3 text-lg font-semibold">
          <span className="sr-only">{n}. </span>
          {title} <span className="text-sm font-normal text-muted">({en})</span>
        </h2>
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-muted [&_strong]:text-fg">{children}</div>
      </div>
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
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-2 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Chính sách bảo mật</h1>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className={chip}>Cập nhật lần cuối: 17/11/2026</span>
            <em>Privacy Policy / Politique de confidentialité</em>
          </p>
        </header>

        <main className="flex flex-col gap-4">
          <Section n={1} title="Tổng quan" en="Overview">
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

          <Section n={2} title="Dữ liệu được truy cập" en="Data Accessed">
            <p>Extension chỉ truy cập dữ liệu khi người dùng chủ động nhấn "Bắt đầu phân tích" hoặc "Làm mới":</p>
            <List
              items={[
                'Lịch sử đơn hàng Shopee (qua API Shopee, sử dụng session trình duyệt)',
                'Thông tin đơn hàng: mã đơn, tên sản phẩm, số lượng, đơn giá, ngày giao, trạng thái, tổng tiền, tên shop',
                'Thông tin tài khoản Shopee: mã người dùng, tên đăng nhập, tên hiển thị và ảnh đại diện (để hiện lời chào và nhận biết khi đổi tài khoản)',
              ]}
            />
            <p>
              Dữ liệu này <strong>chỉ được lưu trên máy người dùng</strong> trong {code('chrome.storage.local')} và{' '}
              <strong>không bao giờ được gửi đến server hay bên thứ ba nào</strong>.
            </p>
          </Section>

          <Section n={3} title="Quyền truy cập và lý do" en="Permissions">
            <dl className="flex flex-col divide-y divide-line rounded-xl border border-line">
              {/* Column labels; the dt/dd pairs already carry the meaning for screen readers. */}
              <div aria-hidden="true" className="hidden gap-4 px-3 py-2 text-xs font-medium sm:flex">
                <span className="w-44 shrink-0">Quyền</span>
                <span>Lý do sử dụng</span>
              </div>
              {PERMISSIONS.map(([name, reason]) => (
                <div key={name} className="flex flex-col gap-1 p-3 sm:flex-row sm:gap-4">
                  <dt className="shrink-0 font-mono font-semibold break-all text-accent-text sm:w-44 sm:whitespace-nowrap">{name}</dt>
                  <dd>{reason}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section n={4} title="Dữ liệu không được chia sẻ" en="No Data Sharing">
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
            <div className="mt-2 rounded-lg bg-[color-mix(in_srgb,var(--good)_var(--tint),transparent)] p-3 font-medium text-good">
              Toàn bộ dữ liệu đơn hàng chỉ tồn tại trên máy của bạn và bị xóa hoàn toàn khi bạn gỡ cài đặt extension.
            </div>
          </Section>

          <Section n={5} title="Lưu trữ dữ liệu" en="Data Storage">
            <p>
              Dữ liệu được lưu tại {code('chrome.storage.local')} — bộ nhớ cục bộ của Chrome, chỉ truy cập được từ extension này, không đồng bộ lên
              cloud. Cài đặt ngân sách và chế độ Sáng/Tối cũng chỉ được lưu trên máy. Dữ liệu bị xóa hoặc thay thế khi:
            </p>
            <List
              items={[
                'Gỡ cài đặt extension',
                'Nhấn "Bắt đầu phân tích" trong popup: lịch sử vừa tải thay thế toàn bộ dữ liệu đã lưu trước đó ("Làm mới" trong dashboard chỉ thêm đơn mới, không xóa đơn cũ)',
              ]}
            />
          </Section>

          <Section n={6} title="Tuyên bố miễn trừ" en="Disclaimer">
            <p>
              ShopeeStatX là dự án mã nguồn mở độc lập, <strong>không liên kết chính thức với Shopee</strong>. Extension sử dụng API Shopee theo cách
              tương tự trình duyệt web bình thường (dùng session đăng nhập sẵn có).
            </p>
          </Section>

          <Section n={7} title="Liên hệ" en="Contact">
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
