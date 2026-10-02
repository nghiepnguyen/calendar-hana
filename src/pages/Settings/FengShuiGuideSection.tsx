import { FENG_SHUI_RULES } from '@shared/personalFengShui/rules'
import { FengShuiSources } from '../../views/DayView/FengShuiSources'
import styles from './FengShuiGuideSection.module.css'

const reviewedRules = FENG_SHUI_RULES.filter((rule) => rule.verificationStatus === 'verified')

export function FengShuiGuideSection() {
  return (
    <div className={styles.guide}>
      <p className={styles.intro}>
        Các kết quả trong tab Ngày là thông tin văn hóa tham khảo. Trang này ghi rõ quy ước, phạm vi
        và nguồn để bạn tự đối chiếu khi cần.
      </p>
      <details open>
        <summary>Ngày và giờ cá nhân</summary>
        <p>
          Đánh giá ngày dùng Can Chi năm sinh theo năm âm lịch Việt Nam, quan hệ Thiên can và nạp
          âm. Năm sinh đổi vào Tết theo UTC+7; ngày đổi lúc 00:00.
        </p>
        <p>
          Giờ được chọn từ giờ hoàng đạo chung, sau đó loại giờ xung tuổi hoặc khắc qua Can. Hệ
          thống ưu tiên giờ hợp hoặc sinh tuổi; hai đoạn giờ Tý cùng thuộc ngày đang xem.
        </p>
        <p>Can Chi năm sinh và nạp âm không đại diện cho Nhật chủ hoặc Dụng thần Bát Tự.</p>
      </details>
      <details>
        <summary>Quan hệ cá nhân mở rộng</summary>
        <p>
          Thiên can xung chỉ dùng bốn cặp đã được đối chiếu: Giáp với Canh, Ất với Tân, Bính với
          Nhâm và Đinh với Quý. Kết quả này là lý do bổ sung, không làm đổi kết luận ngày.
        </p>
        <p>
          Phạm Thái Tuế so chi tuổi với chi năm theo năm quan hệ Trực, Xung, Hình, Hại và Phá. Tuế
          Phá mặc định là Lục Xung; khi trùng Xung Thái Tuế, giao diện chỉ trình bày một sự kiện.
          Tam Sát lấy nhóm Tam Hợp của tuổi và bộ ba chi năm kỵ tương ứng.
        </p>
        <p>
          Sát Chủ là quy tắc chung của ngày theo tháng âm lịch và chi ngày, không phải hạn theo
          tuổi. Tháng nhuận dùng bảng của tháng chính.
        </p>
      </details>
      <details>
        <summary>Hạn theo năm</summary>
        <p>
          Tuổi mụ bằng năm âm đang xem trừ năm âm sinh cộng một. Kim Lâu, Hoang Ốc và Tam Tai được
          xem tách biệt với đánh giá của ngày; không cần giờ hoặc nơi sinh.
        </p>
        <p>
          Kim Lâu chỉ xét cô dâu khi cưới hỏi hoặc gia chủ khi xây nhà. Hoang Ốc chỉ xét gia chủ xây
          nhà. Tam Tai cần xác nhận người đứng chính khi khai trương.
        </p>
        <p>
          Theo quan niệm lịch pháp truyền thống; chỉ dùng để tham khảo. Bảng Sát Chủ là quy tắc dân
          gian, không khẳng định ngày được xét chắc chắn gây bất lợi. Nhóm Nam mạng hoặc Nữ mạng chỉ
          là lựa chọn cách xem sao hạn.
        </p>
      </details>
      <details>
        <summary>Tứ Trụ và quy ước giờ Tý</summary>
        <p>
          Tứ Trụ cần đủ ngày, giờ và nơi sinh. Giao tiết so theo thời điểm UTC; ngày và giờ luận trụ
          dùng giờ Mặt Trời thật. Quy ước giờ Tý đã chọn trong hồ sơ sinh chỉ áp dụng cho Tứ Trụ.
        </p>
        <p>
          Nếu chưa có chỉ dẫn riêng, hãy dùng Tách Dạ Tý / Chính Tý. Chỉ chọn Đổi ngày từ 23:00 khi
          trường phái hoặc người lập lá số của bạn sử dụng quy ước đó.
        </p>
      </details>
      <details>
        <summary>Nguồn và giới hạn</summary>
        <p>
          Các quy tắc dưới đây đã được rà soát trong phạm vi công bố. Thông tin không dự báo sức
          khỏe, tài chính hoặc kết quả công việc.
        </p>
        <FengShuiSources rules={reviewedRules} mutedClassName={styles.muted} />
      </details>
    </div>
  )
}
