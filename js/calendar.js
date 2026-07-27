new Vue({
    el: "#app",

    data() {
        return {
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
            loadingWeather: true,
            weatherReport: [], // 天気データ用
            selectedDate: '', // 現在選択されている日付 (例: "2026-07-23")
            newTaskTitle: '', // 入力欄用のv-model
            tasks: [] // タスク表示の初期値
        };
    },

    mounted() {
        // アプリ起動時に天気予報を取得
        this.fetchWeather();

        // 今日の日付をselectedDateに入れる
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        this.selectedDate = `${today.getFullYear()}-${mm}-${dd}`;

        // 今日から3日間のサンプルタスクを自動生成して追加する
        this.setSampleTasks();
    },

    computed: {
        // カレンダーを描画する関数
        calendar() {
            // 1日の曜日を取得
            const firstDay = new Date(this.year, this.month, 1).getDay();
            // 月末日を取得
            const lastDate = new Date(this.year, this.month + 1, 0).getDate();

            const calendar = [];
            let week = [];

            // 1日までの空白
            for (let i = 0; i < firstDay; i++) {
                week.push("");
            }
            // 1日～31日までの日付をpush
            for (let day = 1; day <= lastDate; day++) {
                week.push(day);
                if (week.length === 7) {
                    calendar.push(week);
                    week = [];
                }
            }
            // 月末後の空白
            while (week.length < 7 && week.length !== 0) {
                week.push("");
            }
            if (week.length) {
                calendar.push(week);
            }
            return calendar;
        },

        // 日付の一致したtasksを返す
        selectedDayTasks() {
            return this.tasks.filter(task => task.date === this.selectedDate);
        }
    },

    methods: {
        // 当日から3日間の日付を計算し、3件のオブジェクト配列を新規作成してtasksに投入する関数。3件目だけ最初から完了。
        setSampleTasks() {
            const titles = ["スクール課題提出", "買い物（雨なら延期）", "面談"];
            this.tasks = titles.map((title, index) => {
                const d = new Date();
                d.setDate(d.getDate() + index);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;
                return {
                    id: index + 1,
                    title: title,
                    date: dateStr,
                    completed: index === 2
                };
            });
        },

        // カレンダーのマスをクリックした時の処理。空白は何もしない
        selectDate(day) {
            if (!day) return;
            this.selectedDate = this.formatDateStr(day);
        },

        // 配列tasksに新しい値を追加して入力欄をクリア
        addTask() {
            if (this.newTaskTitle.trim() === '') return;
            
            this.tasks.push({
                id: Date.now(),
                title: this.newTaskTitle,
                date: this.selectedDate,
                completed: false
            });
            
            this.newTaskTitle = '';
        },

        // タスクを削除する処理(クリックされたタスクのIDと一致しないものだけを残す（＝削除）)
        deleteTask(id) {
            this.tasks = this.tasks.filter(task => task.id !== id);
        },

        // カレンダーの年月日から"YYYY-MM-DD"形式の文字列を作る関数
        formatDateStr(day) {
            if (!day) return "";
            const yyyy = this.year;
            const mm = String(this.month + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        },

        // その日の天気コードを取得して読みやすい天気名に変換して返す関数
        getDayWeather(day) {
            if (!day) return "";
            const dateStr = this.formatDateStr(day);
            const match = this.weatherReport.find(w => w.date === dateStr);
            return match ? this.getWeatherLabel(match.code) : "";
        },

        // その日のタスクを抽出して返す関数
        getDayTasks(day) {
            if (!day) return [];
            const dateStr = this.formatDateStr(day);
            return this.tasks.filter(task => task.date === dateStr);
        },

        // お天気APIの利用。5日分の日付と天気コードを取得してweatherReportに入れる
        async fetchWeather() {
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=35.678&longitude=139.764&daily=weather_code&timezone=Asia%2FTokyo';
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('サーバーエラー');
                const data = await response.json();
                
                const dates = data.daily.time;
                const codes = data.daily.weather_code;
                const report = [];
                
                for (let i = 0; i < 5; i++) {
                    report.push({ date: dates[i], code: codes[i] });
                }
                this.weatherReport = report;
                this.loadingWeather = false;
            } catch (error) {
                console.error('天気データの取得失敗:', error);
                this.loadingWeather = false;
            }
        },

        // 取得したcodeに適した天気マークを返す関数
        getWeatherLabel(code) {
            if (code === 0) return '☀️';
            if (code === 1 || code === 2 || code === 3) return '⛅';
            if (code === 45 || code === 48) return '🌫️';
            if (code === 51 || code === 53 || code === 55) return '🌧️';
            if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return '☔';
            if ((code >= 71 && code <= 75) || code === 85 || code === 86) return '❄️';
            if (code >= 95 && code <= 99) return '⚡';
            return '❓';
        },

        // 翌月ボタンの関数。翌月へ移行。12月だった場合は翌年1月へ移行
        nextMonth() {
            this.month++;
            if (this.month > 11) {
                this.month = 0;
                this.year++;
            }
        },

        // 前月ボタンの関数。前月へ移行。1月だった場合は前年12月へ移行
        prevMonth() {
            this.month--;
            if (this.month < 0) {
                this.month = 11;
                this.year--;
            }
        }
    }
});