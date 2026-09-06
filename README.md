# Rey — 미술 작가 포트폴리오

흰색 배경의 미니멀한 작가 포트폴리오 사이트입니다.  
코딩을 몰라도 `js/data.js`와 `images` 폴더만 고치면 내용을 바꿀 수 있습니다.

나중에 **GitHub Pages**로 무료 배포할 수 있게, 별도의 설치나 빌드 없이 동작합니다.

## 폴더 안내

```
portfolio/
├── index.html          사이트 본체
├── css/style.css       디자인
├── js/data.js          ← 작가 정보와 작품 목록 (여기를 수정)
├── js/app.js           화면 전환 기능
├── images/             ← 작품 사진을 넣는 폴더
├── favicon.svg         브라우저 탭 아이콘
└── README.md           이 설명 파일
```

## 내 컴퓨터에서 보는 방법

1. `index.html` 파일을 더블클릭하면 브라우저에서 열립니다.
2. Works에서 **Ink / 수묵** 작품을 볼 수 있습니다. 이미지를 누르면 상세 화면이 열립니다.
3. 위쪽 **Works / About / CV** 메뉴로 이동합니다.

> 이미지가 안 보이면, 파일을 더블클릭하는 대신 아래처럼 로컬 서버로 열어 보세요.  
> Cursor 터미널에서 이 폴더를 연 뒤 `npx --yes serve .` 를 실행합니다.

## 수묵 작품 정보를 넣는 방법

작품 사진은 이미 `images/ink` 폴더에 번호 순서(01–07)로 들어 있습니다.  
작품명, 연도, 재료, 크기, 설명은 `js/data.js`의 `WORKS`에서 해당 작품의 빈 칸에 적으면 됩니다.

```js
title: "작품명",
year: "2024",
medium: "Ink on paper",
size: "70 × 140 cm",
description: "작품 설명을 여기에 적습니다.",
```

비워 두면 그 항목은 화면에 나타나지 않습니다.

## 작품 분류를 추가하는 방법

`js/data.js`의 `CATEGORIES`에 한 줄을 추가합니다.

```js
{ id: "drawing", label: "Drawing / 드로잉", layout: "grid" },
```

- `layout: "large"` : 수묵처럼 이미지를 크게, 한 장씩
- `layout: "grid"` : 드로잉·사진처럼 여러 칸

그다음 `WORKS`에 `category: "drawing"` 인 작품을 추가하면 됩니다.

## 작가 정보 바꾸는 방법

같은 파일 `js/data.js` 맨 위 `ARTIST` 부분을 수정합니다.

- `name` / `nameKo`: 영문·한글 이름
- `location`: 활동 지역
- `email`: 이메일
- `instagram`: 인스타그램 주소 (없으면 `""` 로 두면 숨겨집니다)
- `statement`: 소개 문단 (여러 줄 가능)
- `bio`: 짧은 약력

사이트 이름(Rey)을 바꾸려면 `index.html`의 `<title>`과 `js/data.js`의 `name`, `siteTitle`을 함께 바꾸면 됩니다.

## CV 수정하는 방법

같은 파일 `js/data.js`의 `CV` 부분을 수정합니다.

- `education`: 학력
- `awards`: 수상
- `exhibitions`: 주요 전시 (`note`에 Solo / Group 등을 적을 수 있습니다. 없으면 지워도 됩니다.)
- `projects`: 프로젝트·프로그램·레지던시
- `experience`: 강의, 어시스턴트 등 경력

한 줄을 더 넣으려면 `{ year: "2024", title: "제목", place: "장소" },` 형태를 복사하면 됩니다.

## GitHub Pages로 올리는 방법

1. [GitHub](https://github.com)에 로그인하고 **New repository**로 저장소를 만듭니다.
2. 이 폴더의 파일을 해당 저장소에 올립니다. (Cursor에서 GitHub에 푸시해도 됩니다.)
3. 저장소 페이지에서 **Settings → Pages**로 갑니다.
4. **Build and deployment → Source**를 **Deploy from a branch**로 둡니다.
5. Branch를 `main` (또는 `master`), 폴더를 `/ (root)`로 선택하고 Save 합니다.
6. 잠시 후 아래 주소로 열립니다.

```
https://아이디.github.io/저장소이름/
```

저장소 이름이 `username.github.io`이면 주소가 `https://username.github.io/` 가 됩니다.

## 나중에 손보면 좋은 것

- 샘플 작품 6점은 예시입니다. 실제 작품으로 교체하세요.
- 이메일과 인스타그램 주소를 본인 것으로 바꾸세요.
- 사진은 너무 큰 원본 대신, 긴 변 2000px 전후의 JPG/PNG를 권장합니다.

질문이나 디자인 조정이 필요하면 이 채팅에서 이어서 요청하면 됩니다.
