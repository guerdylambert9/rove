import { cars } from '../data/cars.js'
import AppBottomNav from '../components/AppBottomNav.jsx'

export default function Dashboard() {
  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="dashhead">
          <h1>July at a glance</h1>
        </div>

        <div className="kpis">
          <div className="kpi dark">
            <div className="lb">Net this month</div>
            <div className="vl">$3,180</div>
            <div className="dl">▲ 12% vs June</div>
          </div>
          <div className="kpi">
            <div className="lb">Utilization</div>
            <div className="vl">58%</div>
            <div className="dl">▲ 6 pts</div>
          </div>
          <div className="kpi">
            <div className="lb">Trips</div>
            <div className="vl">14</div>
          </div>
          <div className="kpi">
            <div className="lb">Avg / day</div>
            <div className="vl">$71</div>
          </div>
        </div>

        <div className="pad" style={{ paddingTop: 4 }}>
          <div className="sectitle">
            Fleet <a>Manage</a>
          </div>
          {cars.map((car) => (
            <div className="fleetrow" key={car.id}>
              <div className="th" style={{ background: car.gradient }} />
              <div>
                <div className="nm">{car.name.replace(/^(Tesla |Jeep |Honda )/, '')}</div>
                <div className={`st ${car.status}`}>
                  <span className="dot" />
                  {car.statusLabel}
                </div>
              </div>
              <div className="ern">
                <b>${car.pricePerDay}</b>
                <span>/day</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
