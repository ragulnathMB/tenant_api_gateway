const { getUserDBPool, getTenantDBPool, sql } = require('../config/database');

class TenantService {
  async createTenant(tenantData) {
    const { TenantID, Name, LicenseCount = 0, APIList = {}, LicenseType = null, EnabledUsersCount = 0, DisabledUsersCount = 0, LicenseExpiry = null } = tenantData;
    
    if (!TenantID || !Name) {
      throw new Error('TenantID and Name are required');
    }

    const pool = getTenantDBPool();
    await pool.request()
      .input('TenantID', sql.VarChar(50), TenantID)
      .input('Name', sql.VarChar(100), Name)
      .input('LicenseCount', sql.Int, LicenseCount)
      .input('APIList', sql.NVarChar(sql.MAX), JSON.stringify(APIList))
      .input('LicenseType', sql.VarChar(50), LicenseType)
      .input('EnabledUsersCount', sql.Int, EnabledUsersCount)
      .input('DisabledUsersCount', sql.Int, DisabledUsersCount)
      .input('LicenseExpiry', sql.DateTime, LicenseExpiry)
      .query(`
        INSERT INTO dbo.Tenants (TenantID, Name, LicenseCount, APIList, LicenseType, EnabledUsersCount, DisabledUsersCount, LicenseExpiry)
        VALUES (@TenantID, @Name, @LicenseCount, @APIList, @LicenseType, @EnabledUsersCount, @DisabledUsersCount, @LicenseExpiry)
      `);
    
    return { message: 'Tenant created successfully' };
  }

  async getTenantById(tenantId) {
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT * FROM Tenants WHERE TenantID = @tenantId');
    
    if (result.recordset.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const tenant = result.recordset[0];
    return {
      TenantID: tenant.TenantID,
      Name: tenant.Name,
      LicenseCount: tenant.LicenseCount,
      APIList: tenant.APIList ? JSON.parse(tenant.APIList) : {},
      LicenseType: tenant.LicenseType,
      EnabledUsersCount: tenant.EnabledUsersCount,
      DisabledUsersCount: tenant.DisabledUsersCount,
      LicenseExpiry: tenant.LicenseExpiry
    };
  }

  async getAllTenants() {
    const tenantPool = getTenantDBPool();
    const userPool = getUserDBPool();

    // Get all tenants
    const result = await tenantPool.request().query('SELECT * FROM dbo.Tenants');
    const tenants = result.recordset;

    // Get enabled/disabled users count grouped by TenentID
    const userCountResult = await userPool.request().query(`
      SELECT TenentID, Status, COUNT(*) AS Count
      FROM dbo.Users
      GROUP BY TenentID, Status
    `);

    // Organize counts into a map
    const countsMap = {};
    userCountResult.recordset.forEach(row => {
      const tenantId = row.TenentID;
      const status = row.Status?.toLowerCase();
      const count = row.Count || 0;

      if (!countsMap[tenantId]) {
        countsMap[tenantId] = { enabled: 0, disabled: 0 };
      }

      if (status === 'enabled') {
        countsMap[tenantId].enabled = count;
      } else if (status === 'disabled') {
        countsMap[tenantId].disabled = count;
      }
    });

    // Merge counts into tenants array
    return tenants.map(row => ({
      TenantID: row.TenantID,
      Name: row.Name,
      LicenseCount: row.LicenseCount,
      APIList: row.APIList ? JSON.parse(row.APIList) : {},
      LicenseType: row.LicenseType,
      EnabledUsersCount: countsMap[row.TenantID]?.enabled || 0,
      DisabledUsersCount: countsMap[row.TenantID]?.disabled || 0,
      LicenseExpiry: row.LicenseExpiry
    }));
  }

  async updateTenantInfo(tenantId, updateData) {
    const { name, licenseCount, licenseType, enabledUsersCount, disabledUsersCount, licenseExpiry } = updateData;
    const pool = getTenantDBPool();
    let updateFields = [];
    let request = pool.request().input('tenantId', sql.VarChar, tenantId);
    
    if (name !== undefined) {
      updateFields.push('Name = @name');
      request.input('name', sql.VarChar, name);
    }
    if (licenseCount !== undefined) {
      updateFields.push('LicenseCount = @licenseCount');
      request.input('licenseCount', sql.Int, licenseCount);
    }
    if (licenseType !== undefined) {
      updateFields.push('LicenseType = @licenseType');
      request.input('licenseType', sql.VarChar, licenseType);
    }
    if (enabledUsersCount !== undefined) {
      updateFields.push('EnabledUsersCount = @enabledUsersCount');
      request.input('enabledUsersCount', sql.Int, enabledUsersCount);
    }
    if (disabledUsersCount !== undefined) {
      updateFields.push('DisabledUsersCount = @disabledUsersCount');
      request.input('disabledUsersCount', sql.Int, disabledUsersCount);
    }
    if (licenseExpiry !== undefined) {
      updateFields.push('LicenseExpiry = @licenseExpiry');
      request.input('licenseExpiry', sql.DateTime, licenseExpiry);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `UPDATE dbo.Tenants SET ${updateFields.join(', ')} WHERE TenantID = @tenantId`;
    await request.query(query);
    return { message: 'Tenant info updated' };
  }

  async updateLicenseCounts(tenantId, enabledUsersCount, disabledUsersCount) {
    const pool = getTenantDBPool();
    await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .input('enabledUsersCount', sql.Int, enabledUsersCount)
      .input('disabledUsersCount', sql.Int, disabledUsersCount)
      .query(`UPDATE dbo.Tenants 
              SET EnabledUsersCount = @enabledUsersCount, 
                  DisabledUsersCount = @disabledUsersCount 
              WHERE TenantID = @tenantId`);
    
    return { message: 'License counts updated' };
  }

  async updateLicenseExpiry(tenantId, licenseExpiry) {
    const pool = getTenantDBPool();
    await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .input('licenseExpiry', sql.DateTime, licenseExpiry)
      .query('UPDATE dbo.Tenants SET LicenseExpiry = @licenseExpiry WHERE TenantID = @tenantId');
    
    return { message: 'License expiry updated' };
  }

  async deleteTenant(tenantId) {
    const pool = getTenantDBPool();
    const result = await pool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('DELETE FROM dbo.Tenants WHERE TenantID = @tenantId');
    
    if (result.rowsAffected[0] === 0) {
      throw new Error('Tenant not found');
    }
    
    return { message: 'Tenant deleted successfully' };
  }

  async deleteMultipleTenants(tenantIds) {
    if (!Array.isArray(tenantIds)) {
      throw new Error('tenantIds should be an array');
    }

    const pool = getTenantDBPool();
    for (const id of tenantIds) {
      await pool.request()
        .input('tenantId', sql.VarChar, id)
        .query('DELETE FROM Tenants WHERE TenantID = @tenantId');
    }
    
    return { message: 'Tenants deleted successfully' };
  }

  async getTenantStats(tenantId) {
    const tenantPool = getTenantDBPool();
    const tenantResult = await tenantPool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query('SELECT * FROM dbo.Tenants WHERE TenantID = @tenantId');
    
    if (tenantResult.recordset.length === 0) {
      throw new Error('Tenant not found');
    }
    
    const userPool = getUserDBPool();
    const userResult = await userPool.request()
      .input('tenantId', sql.VarChar, tenantId)
      .query(`
        SELECT 
          COUNT(*) as TotalUsers,
          SUM(CASE WHEN Status = 'Enabled' THEN 1 ELSE 0 END) as EnabledUsers,
          SUM(CASE WHEN Status = 'Disabled' THEN 1 ELSE 0 END) as DisabledUsers
        FROM Users 
        WHERE TenantID = @tenantId
      `);
    
    const tenant = tenantResult.recordset[0];
    const userStats = userResult.recordset[0];
    
    return {
      TenantID: tenant.TenantID,
      Name: tenant.Name,
      LicenseCount: tenant.LicenseCount,
      LicenseType: tenant.LicenseType,
      LicenseExpiry: tenant.LicenseExpiry,
      TotalUsers: userStats.TotalUsers,
      EnabledUsers: userStats.EnabledUsers,
      DisabledUsers: userStats.DisabledUsers,
      AvailableLicenses: tenant.LicenseCount - userStats.EnabledUsers,
      APICount: tenant.APIList ? Object.keys(JSON.parse(tenant.APIList)).length : 0
    };
  }
}

module.exports = new TenantService();
