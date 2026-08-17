from backend.scraper.screener_parser import parse_screener_html_content

html_sample = """
  <div class="card card-large" id="top">
    <div class="flex flex-space-between flex-gap-8">
      <div class="flex-row flex-wrap flex-align-center flex-grow" style="flex-basis: 300px">
        <h1 class="margin-0 show-from-tablet-landscape">Ather Energy Ltd</h1>
        <div class="font-size-18 strong line-height-14">
          <div class="flex flex-align-center">
            <span>₹ 1,512</span>
          </div>
        </div>
      </div>
    </div>
    <div class="company-ratios">
      <ul id="top-ratios">
        <li class="flex flex-space-between" data-source="default">
          <span class="name">Market Cap</span>
          <span class="nowrap value">₹ <span class="number">59,628</span> Cr.</span>
        </li>
        <li class="flex flex-space-between" data-source="default">
          <span class="name">Current Price</span>
          <span class="nowrap value">₹ <span class="number">1,512</span></span>
        </li>
        <li class="flex flex-space-between" data-source="default">
          <span class="name">Stock P/E</span>
          <span class="nowrap value"><span class="number"></span></span>
        </li>
        <li class="flex flex-space-between" data-source="default">
          <span class="name">Book Value</span>
          <span class="nowrap value">₹ <span class="number">67.2</span></span>
        </li>
        <li class="flex flex-space-between" data-source="default">
          <span class="name">Dividend Yield</span>
          <span class="nowrap value"><span class="number">0.00</span> %</span>
        </li>
        <li class="flex flex-space-between" data-source="default">
          <span class="name">ROCE</span>
          <span class="nowrap value"><span class="number">-19.8</span> %</span>
        </li>
        <li class="flex flex-space-between" data-source="default">
          <span class="name">ROE</span>
          <span class="nowrap value"><span class="number">-33.4</span> %</span>
        </li>
        <li class="flex flex-space-between" data-source="quick-ratio">
          <span class="name">Debt to equity</span>
          <span class="nowrap value"><span class="number">0.26</span></span>
        </li>
        <li class="flex flex-space-between" data-source="quick-ratio">
          <span class="name">Sales growth 3Years</span>
          <span class="nowrap value"><span class="number">27.3</span> %</span>
        </li>
        <li class="flex flex-space-between" data-source="quick-ratio">
          <span class="name">Profit growth</span>
          <span class="nowrap value"><span class="number">52.4</span> %</span>
        </li>
      </ul>
    </div>
  </div>
"""

res = parse_screener_html_content(html_sample, "ATHERENERG")
print(res.model_dump())
